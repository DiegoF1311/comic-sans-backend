FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server ./cmd

FROM alpine:3.19

RUN apk add --no-cache ca-certificates wget && \
    addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY --from=builder /app/server .

USER app

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3003/health || exit 1

ENTRYPOINT ["/app/server"]
