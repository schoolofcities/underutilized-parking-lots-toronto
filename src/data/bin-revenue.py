import pandas as pd

df = pd.read_csv("CityParkingLot_AllData_Geocoded.csv")

df = df[df['Type'] == 'Surface']

df['Space Count'] = pd.to_numeric(df['Space Count'], errors='coerce').astype('Int64')

bins = range(0, 51, 10)  # This creates bins like [0-5), [5-10), [10-15), ..., [45-50]
labels = [f'{i}-{i+5}' for i in range(0, 50, 10)]

# Create a new column with the bin ranges for the 'average' column
df['average_bin'] = pd.cut(df['Revenue per space per day'], bins=bins, labels=labels, right=False)

print(df['Space Count'].describe())

# Group by the bins and sum the 'count' column
binned_counts = df.groupby('average_bin')['Space Count'].sum().reset_index()

binned_counts["percent"] = 100 * binned_counts["Space Count"] / binned_counts["Space Count"].sum()

print(binned_counts)

print((df['Revenue per space per day'] * df['Space Count']).sum() / df['Space Count'].sum())

# 75% < 5 per day
# 3.42% > 20 per day