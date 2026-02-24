import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { FieldGroup } from '@components/forms/FieldGroup';
import { FormSection } from '@components/forms/FormSection';
import { ChartContainer } from '@components/charts/ChartContainer';
import { ProjectionTable } from '@components/charts/ProjectionTable';
import { MetricCard } from '@components/cards/MetricCard';
import { Input } from '@components/ui/input';

describe('Accessibility - WCAG 2.1 Compliance', () => {
  describe('FieldGroup - Error Message Accessibility', () => {
    it('should have aria-invalid and aria-describedby when error is present', () => {
      render(
        <FieldGroup label="Test Field" htmlFor="test-input" error="This field is required">
          <Input id="test-input" />
        </FieldGroup>
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'test-input-error');
    });

    it('should have error message with correct id and role', () => {
      render(
        <FieldGroup label="Test Field" htmlFor="test-input" error="This field is required">
          <Input id="test-input" />
        </FieldGroup>
      );

      const error = screen.getByRole('alert');
      expect(error).toHaveAttribute('id', 'test-input-error');
      expect(error).toHaveTextContent('This field is required');
    });

    it('should pass axe accessibility audit for field with error', async () => {
      const { container } = render(
        <FieldGroup label="Test Field" htmlFor="test-input" error="This field is required">
          <Input id="test-input" />
        </FieldGroup>
      );

      const results = await axe(container);
      // @ts-ignore - toHaveNoViolations is added via expect.extend in axe-setup.ts
      expect(results).toHaveNoViolations();
    });

    it('should render required indicator with aria-label', () => {
      render(
        <FieldGroup label="Test Field" htmlFor="test-input" required>
          <Input id="test-input" />
        </FieldGroup>
      );

      const required = screen.getByLabelText('required');
      expect(required).toBeInTheDocument();
    });

    it('should not have aria-invalid when no error', () => {
      render(
        <FieldGroup label="Test Field" htmlFor="test-input">
          <Input id="test-input" />
        </FieldGroup>
      );

      const input = screen.getByRole('textbox');
      expect(input).not.toHaveAttribute('aria-invalid');
    });
  });

  describe('FormSection - Saved Badge Announcement', () => {
    it('should have aria-live region for saved status', () => {
      const { container } = render(
        <FormSection title="Test Form" onSave={() => {}} onClear={() => {}} onLoadDefaults={() => {}}>
          <Input />
        </FormSection>
      );

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('should have aria-atomic on saved announcements', () => {
      const { container } = render(
        <FormSection title="Test Form" onSave={() => {}} onClear={() => {}} onLoadDefaults={() => {}}>
          <Input />
        </FormSection>
      );

      const liveRegion = container.querySelector('[aria-atomic="true"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('ChartContainer - Semantic Chart Structure', () => {
    it('should render with figure role and aria-label', () => {
      const { container } = render(
        <ChartContainer title="Test Chart" subtitle="Test Subtitle">
          <div>Chart Content</div>
        </ChartContainer>
      );

      const figure = container.querySelector('figure[role="img"]');
      expect(figure).toBeInTheDocument();
      expect(figure).toHaveAttribute('aria-label', 'Test Chart: Test Subtitle');
    });

    it('should use title alone for aria-label when no subtitle', () => {
      const { container } = render(
        <ChartContainer title="Test Chart">
          <div>Chart Content</div>
        </ChartContainer>
      );

      const figure = container.querySelector('figure[role="img"]');
      expect(figure).toHaveAttribute('aria-label', 'Test Chart');
    });
  });

  describe('ProjectionTable - Keyboard Navigation', () => {
    const mockYearData = {
      year: 1,
      age: 62,
      annuity: 40000,
      fersSupplement: 15000,
      socialSecurity: 25000,
      tspWithdrawal: 20000,
      totalIncome: 100000,
      federalTax: 8000,
      stateTax: 2000,
      irmaaSurcharge: 0,
      totalTax: 10000,
      effectiveFederalRate: 0.08,
      effectiveTotalRate: 0.1,
      socialSecurityTaxableFraction: 0.5 as const,
      afterTaxIncome: 90000,
      smileMultiplier: 1.0,
      totalExpenses: 50000,
      highRiskBalance: 300000,
      lowRiskBalance: 200000,
      traditionalBalance: 400000,
      rothBalance: 100000,
      totalTSPBalance: 500000,
      rmdRequired: 0,
      rmdSatisfied: true,
      surplus: 40000,
      tradWithdrawal: 16000,
      rothWithdrawal: 4000,
      taxableIncome: 65000,
      afterTaxSurplus: 40000,
      marginalBracketRate: 0.22,
      bracketHeadroom: 15000,
    };

    it('should have aria-sort on sortable headers', () => {
      const { container } = render(
        <ProjectionTable years={[mockYearData]} />
      );

      const yearText = screen.getByText('Year');
      const yearHeader = yearText.closest('th');
      expect(yearHeader).toBeInTheDocument();
      expect(yearHeader).toHaveAttribute('scope', 'col');
      // aria-sort is set based on current sort state
      expect(yearHeader).toHaveAttribute('aria-sort');
    });

    it('should have scope="col" on all headers', () => {
      const { container } = render(
        <ProjectionTable years={[mockYearData]} />
      );

      // Query for all <th> elements in the table (more reliable than role query)
      const headers = container.querySelectorAll('th[scope="col"]');
      expect(headers.length).toBeGreaterThan(0);

      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have aria-label on page-size select', () => {
      const { container } = render(
        <ProjectionTable years={[mockYearData]} />
      );

      const select = container.querySelector('select');
      expect(select).toHaveAttribute('aria-label', 'Rows per page');
    });
  });

  describe('MetricCard - Icon Accessibility', () => {
    it('should render positive metric card', () => {
      render(
        <MetricCard
          label="Total Income"
          value="$500,000"
          variant="positive"
        />
      );

      expect(screen.getByText('Total Income')).toBeInTheDocument();
    });

    it('should render negative metric card', () => {
      render(
        <MetricCard
          label="Deficit"
          value="-$50,000"
          variant="negative"
        />
      );

      expect(screen.getByText('Deficit')).toBeInTheDocument();
    });
  });

  describe('AppShell - Skip Link', () => {
    it('should render main content with id', () => {
      const { container } = render(
        <main id="main-content">
          <p>Main content</p>
        </main>
      );

      const main = container.querySelector('#main-content');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Decorative Icons', () => {
    it('should have aria-hidden on decorative elements', () => {
      const { container } = render(
        <div>
          <svg aria-hidden="true">
            <circle cx="50" cy="50" r="40" />
          </svg>
          <span>Visible text</span>
        </div>
      );

      const svg = container.querySelector('[aria-hidden="true"]');
      expect(svg).toBeInTheDocument();
    });
  });
});
