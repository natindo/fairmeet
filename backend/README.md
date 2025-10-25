Start:
```
goose -dir ./migrations postgres "postgres://postgres:postgres@localhost:5432/fairmeet?sslmode=disable" up

go run cmd/server/main.go
```