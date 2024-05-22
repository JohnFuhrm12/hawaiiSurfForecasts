import pandas as pd

BuoyInfo = pd.read_csv('https://www.ndbc.noaa.gov/data/realtime2/51201.txt', delim_whitespace=True)

print(BuoyInfo)