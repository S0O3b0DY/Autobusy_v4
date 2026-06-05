from google.transit import gtfs_realtime_pb2
import urllib.request

# Nazwa pliku	Rozszerzenie	Ostatnia modyfikacja | Rozmiar	Link
# GTFS	zip	Data aktualizacji: 03.06.2026 16:33:42 | Rozmiar pliku: 26,49 MB	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/GTFS.zip
# alerts	bin	Data aktualizacji: 05.06.2026 15:50:01 | Rozmiar pliku: 15,00 B	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/alerts.bin
# trip_updates	bin	Data aktualizacji: 05.06.2026 15:50:01 | Rozmiar pliku: 24,50 KB	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/trip_updates.bin
# vehicle_positions	bin	Data aktualizacji: 05.06.2026 15:50:01 | Rozmiar pliku: 25,45 KB	https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/vehicle_positions.bin

# 1. Pobieranie danych z feedu (zmień URL na swój)
url = "https://otwarte.miasto.lodz.pl/wp-content/uploads/2025/06/trip_updates.bin"
feed = gtfs_realtime_pb2.FeedMessage()

try:
  response = urllib.request.urlopen(url)
  feed.ParseFromString(response.read())
  
  # 2. Wyświetlenie danych w czytelnym formacie tekstowym
  print(feed)
    
except Exception as e:
  print(f"Błąd podczas pobierania lub dekodowania: {e}")