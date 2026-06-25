from google.transit import gtfs_realtime_pb2
import urllib.request

# Nazwa pliku	Rozszerzenie	Ostatnia modyfikacja | Rozmiar	Link
# GTFS	zip	Data aktualizacji: 03.06.2026 16:33:42 | Rozmiar pliku: 26,49 MB	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/GTFS.zip
# alerts	bin	Data aktualizacji: 05.06.2026 15:50:01 | Rozmiar pliku: 15,00 B	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/alerts.bin
# trip_updates	bin	Data aktualizacji: 05.06.2026 15:50:01 | Rozmiar pliku: 24,50 KB	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/trip_updates.bin
# vehicle_positions	bin	Data aktualizacji: 05.06.2026 15:50:01 | Rozmiar pliku: 25,45 KB	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/vehicle_positions.bin

# 1. Pobieranie danych z feedu (zmień URL na swój)
# url = "https://cdn.zbiorkom.live/gtfs-rt/lodz.pb"
# feed = gtfs_realtime_pb2.FeedMessage()

# try:
#   response = urllib.request.urlopen(url)
#   feed.ParseFromString(response.read())
  
#   # 2. Wyświetlenie danych w czytelnym formacie tekstowym
#   print(feed)
    
# except Exception as e:
#   print(f"Błąd podczas pobierania lub dekodowania: {e}")

# '''
# header {
#   gtfs_realtime_version: "2.0"
#   incrementality: FULL_DATASET
#   timestamp: 1780682196
# }
# entity {
#   id: "trip_11414_17137"
#   trip_update {
#     trip {
#       trip_id: "11414_17137"
#       schedule_relationship: SCHEDULED
#       route_id: "83"
#       direction_id: 1
#     }
#     stop_time_update {
#       stop_sequence: 4
#       arrival {
#         delay: -1414
#       }
#       stop_id: "1767"
#       schedule_relationship: SCHEDULED
#     }
#     vehicle {
#       id: "1004"
#       label: "1004"
#       license_plate: ""
#     }
#     timestamp: 1780682188
#   }
# }

# header {
#   gtfs_realtime_version: "2.0"
#   incrementality: FULL_DATASET
#   timestamp: 1780682256
# }
# entity {
#   id: "vehicle_1004"
#   vehicle {
#     trip {
#       trip_id: "11414_17137"
#       schedule_relationship: SCHEDULED
#       route_id: "83"
#       direction_id: 1
#     }
#     position {
#       latitude: 51.7927513
#       longitude: 19.4259605
#       speed: 0
#     }
#     current_stop_sequence: 4
#     current_status: IN_TRANSIT_TO
#     timestamp: 1780682252
#     stop_id: "1767"
#     vehicle {
#       id: "1004"
#       label: "1004"
#       license_plate: ""
#     }
#     occupancy_status: NO_DATA_AVAILABLE
#   }
# }
# '''

# # 1. Ścieżka do Twojego pliku .pb
# file_path = "C:\\Users\\Szymon\\Downloads\\lodz.pb"

# # 2. Utworzenie pustego obiektu FeedMessage
# feed = gtfs_realtime_pb2.FeedMessage()

# try:
#     # 3. Otwarcie pliku w trybie binarnym ('rb') i sparsowanie danych
#     with open(file_path, 'rb') as f:
#         feed.ParseFromString(f.read())
    
#     # 4. Przetwarzanie odczytanych danych
#     print("Nagłówek feedu:")
#     print(feed.header)
    
#     print(f"\nZnaleziono encji: {len(feed.entity)}")
    
#     # Przykładowe wypisanie pierwszych 5 encji
#     for entity in feed.entity:
#         print("-" * 40)
#         print(f"ID encji: {entity.id}")
        
#         # Sprawdzamy, jaki typ danych zawiera encja
#         if entity.HasField('trip_update'):
#             print("Typ: TripUpdate (Opóźnienia)")
#             print(entity.trip_update)
#         elif entity.HasField('vehicle'):
#             print("Typ: VehiclePosition (Pozycja pojazdu)")
#             print(entity.vehicle)
#         elif entity.HasField('alert'):
#             print("Typ: Alert (Komunikat)")
#             print(entity.alert)

# except FileNotFoundError:
#     print(f"Błąd: Nie znaleziono pliku o ścieżce {file_path}")
# except Exception as e:
#     print(f"Wystąpił błąd podczas parsowania pliku: {e}")


import gtfs_kit as gk

# Wczytujesz cały folder z plikami GTFS
feed = gk.read_feed('C:\\Users\\Szymon\\Downloads\\GTFS.zip', dist_units='m')

# Jedno polecenie buduje kompletną geometrię tras wraz z przystankami
trip_geom = gk.trips.map_trips(feed, ['11418_25023'], show_stops=True)
print(trip_geom)