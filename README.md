# Room Booking API Lab05

![CI](https://github.com/lunnarphase/ZTPAI_Lab05/actions/workflows/ci.yml/badge.svg)

## Uruchomienie od zera

Wymagany Docker Desktop / Docker Engine z Compose v2 oraz Git.

```sh
git clone https://github.com/lunnarphase/ZTPAI_Lab05.git
cd ZTPAI_Lab05
cp .env.example .env
docker compose up --build
```

API: http://localhost:3005/api/docs/ (Swagger UI jest publiczny).
Schemat bazy tworzą migracje przy starcie; PostgreSQL ma healthcheck i named volume.
W PowerShell odpowiednikiem `cp` jest `Copy-Item`.
Wzorzec .env.example zawiera wyłącznie lokalne dane demonstracyjne.
Przed użyciem prawdziwych danych zastąp hasło bazy i JWT_SECRET własnymi wartościami.

## Konto demonstracyjne i Postman

W drugim terminalu, w katalogu projektu:

```sh
docker compose exec api npx knex seed:run
```

Seed usuwa dane demonstracyjne i tworzy ADMIN admin@example.com oraz USER
anna@example.com i jan@example.com. Hasło wszystkich kont demo: demo-password-123.
Zaimportuj `Lab05.postman_collection.json`. Wykonuj żądania 01–08 po kolei.
Skrypty kolekcji zachowują tokeny i ID tworzonej rezerwacji w jej zmiennych.

## Testy

```sh
npm ci
docker compose exec db createdb -U lab05 room_booking_lab05_test
npm run test:unit
npm run test:integration
npm test
```

Polecenie createdb wykonaj raz. Integracja tworzy schemat migracjami, czyści stan przed
każdym testem i zamyka pulę po zakończeniu. Dopuszczona jest wyłącznie baza z sufiksem
_test, wskazana przez TEST_DATABASE_URL. Testy unit nie importują Knex ani konfiguracji
aplikacji i działają bez PostgreSQL; zegar jest wstrzyknięty i stan tworzony od nowa.
Jest setupFiles ustawia konfigurację integracji przed importem aplikacji.

## Eventy i shutdown

Service publikuje reservation.created i reservation.cancelled po COMMIT. Nieudana
operacja i ponowne anulowanie nie emitują eventu. EventEmitter ma izolowane listenery:
audit log w jsonb i symulację powiadomienia dla ADMIN anulującego cudzą rezerwację.
GET /api/admin/audit-log jest dostępny tylko dla ADMIN; obsługuje page, limit i eventType.
Na SIGTERM serwer kończy HTTP, czeka na listenery i zamyka pulę bazy.
Event bus jest pamięciowy: awaria procesu po COMMIT może spowodować utratę zdarzenia.

## CI

Workflow działa przy push do main i przy każdym PR. Uruchamia PostgreSQL service,
checkout, Node 22 z cache npm, npm ci, npm test oraz docker build.
Tymczasowy PostgreSQL runnera ma trust, nie zawiera rzeczywistych danych ani sekretów.
Klucz JWT testów jest losowany przez setupEnv. Żaden sekret nie jest wpisany w workflow.
