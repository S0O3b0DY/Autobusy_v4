import json
from google.protobuf.json_format import MessageToJson
from google.transit import gtfs_realtime_pb2

# Wczytanie binarnego pliku .pb
feed = gtfs_realtime_pb2.FeedMessage()
with open("lodz.pb", "rb") as f:
    feed.ParseFromString(f.read())

# Konwersja na format JSON
json_data = MessageToJson(feed)

# Zapisanie do czytelnego pliku tekstowego
with open("lodz.json", "w") as f:
    f.write(json_data)

print("Plik został pomyślnie przekonwertowany do wynik.json!")