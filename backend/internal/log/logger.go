package log

import (
	"os"

	"github.com/rs/zerolog"
)

func New() zerolog.Logger {
	l := zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout}).With().Timestamp().Logger()
	return l
}
