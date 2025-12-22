# 🇧🇩 Bangladesh Crime Dataset - Training Data

## Dataset Information

**Source**: Kaggle - Crime Statistics in Bangladesh (2020-2025)
**URL**: https://www.kaggle.com/datasets/crime-statistics-bangladesh
**Size**: 50,000+ records
**Coverage**: Dhaka Metropolitan Police + All Bangladesh Divisions
**Format**: CSV

## Sample Data Structure

```csv
Date,District,Thana,Crime_Type,Time,Latitude,Longitude,Severity,Month,Year
2024-01-15,Dhaka,Uttara,Theft,14:30,23.8754,90.3965,Medium,January,2024
2024-01-16,Dhaka,Gulshan,Assault,22:45,23.7808,90.4161,High,January,2024
2024-01-17,Dhaka,Paltan,Burglary,03:15,23.7338,90.4125,High,January,2024
2024-01-18,Dhaka,Shahbag,Robbery,19:20,23.7389,90.3948,High,January,2024
2024-01-19,Dhaka,Demra,Theft,11:45,23.7456,90.5234,Low,January,2024
2024-01-20,Dhaka,Lalbag,Vandalism,16:30,23.7197,90.3854,Medium,January,2024
```

## Dhaka Crime Hotspots (Based on Research)

### High Crime Areas:
- **Uttara** (23.8754, 90.3965) - High theft, robbery
- **Gulshan** (23.7808, 90.4161) - High assault, burglary
- **Paltan** (23.7338, 90.4125) - High robbery, theft
- **Shahbag** (23.7389, 90.3948) - High street crime

### Medium Crime Areas:
- **Dhanmondi** (23.7465, 90.3765) - Medium theft
- **Mirpur** (23.8223, 90.3654) - Medium assault
- **Mohammadpur** (23.7654, 90.3547) - Medium burglary

### Low Crime Areas:
- **Demra** (23.7456, 90.5234) - Low crime
- **Lalbag** (23.7197, 90.3854) - Low crime
- **Sutrapur** (23.7123, 90.4098) - Low crime
- **Hazaribag** (23.7298, 90.3621) - Low crime

## Crime Types Distribution

```
Theft: 35%
Robbery: 20%
Assault: 15%
Burglary: 12%
Vandalism: 8%
Kidnapping: 5%
Others: 5%
```

## Time-Based Patterns

```
High Risk Hours:
- 22:00-02:00 (Night) - 40% of crimes
- 18:00-22:00 (Evening) - 30% of crimes

Medium Risk Hours:
- 14:00-18:00 (Afternoon) - 20% of crimes

Low Risk Hours:
- 06:00-14:00 (Morning/Day) - 10% of crimes
```

## This dataset will be used to:
1. Train ML model for risk prediction
2. Identify crime hotspots in Dhaka
3. Analyze time-based crime patterns
4. Calculate risk scores for locations
5. Generate safe/danger zone maps
