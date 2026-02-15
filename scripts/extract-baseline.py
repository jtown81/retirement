#!/usr/bin/env python3
"""
Extract baseline expected values from Retire-original.xlsx for spreadsheet parity testing.

Usage:
  python3 scripts/extract-baseline.py [--scenario gs-straight-through] [--output app/tests/scenarios/fixtures/baseline.json]

Requirements:
  - openpyxl (install: pip install openpyxl)

This script reads the Retire-original.xlsx spreadsheet and extracts key values for the
GS straight-through, LEO, military buyback, and Roth vs Traditional scenarios.

The extracted values are written to baseline.json for use in scenario tests with tolerance
matching per docs/spreadsheet-parity.md.
"""

import json
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("Error: openpyxl not installed. Install with: pip install openpyxl")
    sys.exit(1)


def extract_gs_straight_through(wb):
    """
    Extract values for GS straight-through scenario.

    Expected sheets: "Basic Calculator", "Examples", or similar with example data.
    """
    # This is a placeholder structure - fill in actual cell references once you identify them
    result = {
        "status": "pending",
        "description": "Full GS career, standard FERS retirement at age 57 with 30 years service",
        "expectedValues": {
            "careerProfile": {
                "hireDate": None,
                "retirementDate": None,
                "birthDate": None,
            },
            "annuityCalculation": {
                "high3Salary": None,
                "creditableServiceYears": None,
                "multiplier": None,
                "grossAnnuity": None,
                "reductionFactor": None,
                "netAnnuity": None,
            },
            "tspProjection": {
                "currentBalance": None,
                "projectedBalanceAtRetirement": None,
                "monthlyContribution": None,
                "assumedGrowthRate": None,
            },
            "fersSupplement": {
                "eligible": None,
                "monthlyAmount": None,
                "annualAmount": None,
            },
            "projectionYears": {
                "year1": {"annuity": None, "tspWithdrawal": None, "expenses": None, "surplus": None},
                "year10": {"annuity": None, "tspWithdrawal": None, "expenses": None, "surplus": None},
                "year20": {"annuity": None, "tspWithdrawal": None, "expenses": None, "surplus": None},
                "year30": {"annuity": None, "tspWithdrawal": None, "expenses": None, "surplus": None},
            },
        },
        "notes": [
            "TODO: Identify which sheet contains the GS scenario data",
            "TODO: Map cell references for each value above",
            "TODO: Extract values and populate expectedValues",
            "Tolerances: currency ±$1.00, percentages ±0.001%"
        ]
    }
    return result


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Extract baseline values from Retire-original.xlsx")
    parser.add_argument("--scenario", default="gs-straight-through", help="Scenario to extract")
    parser.add_argument("--output", default="app/tests/scenarios/fixtures/baseline.json", help="Output JSON file")
    parser.add_argument("--spreadsheet", default="Retire-original.xlsx", help="Path to spreadsheet")

    args = parser.parse_args()

    spreadsheet_path = Path(args.spreadsheet)
    if not spreadsheet_path.exists():
        print(f"Error: {spreadsheet_path} not found")
        sys.exit(1)

    print(f"Loading {spreadsheet_path}...")
    try:
        wb = openpyxl.load_workbook(spreadsheet_path, data_only=True)
    except Exception as e:
        print(f"Error loading workbook: {e}")
        sys.exit(1)

    print(f"Available sheets:")
    for sheet in wb.sheetnames:
        print(f"  - {sheet}")

    # Dispatch based on scenario
    if args.scenario == "gs-straight-through":
        extracted = extract_gs_straight_through(wb)
    else:
        print(f"Error: Unknown scenario '{args.scenario}'")
        sys.exit(1)

    # Load existing baseline.json
    output_path = Path(args.output)
    if output_path.exists():
        with open(output_path) as f:
            baseline = json.load(f)
    else:
        baseline = {
            "schemaVersion": 1,
            "extractionNotes": {
                "method": "Python script (see scripts/extract-baseline.py)",
                "tolerances": {
                    "currency_annual": "±$1.00",
                    "currency_monthly": "±$0.10",
                    "percentages": "±0.001%",
                    "dates": "exact"
                }
            },
            "scenarios": {}
        }

    # Update the scenario
    baseline["scenarios"][args.scenario] = extracted

    # Write back
    with open(output_path, 'w') as f:
        json.dump(baseline, f, indent=2)

    print(f"\nUpdated {output_path}")
    print(json.dumps(extracted, indent=2))


if __name__ == "__main__":
    main()
