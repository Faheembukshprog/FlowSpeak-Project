# ==============================================================================
# STAGE 1: Build & Publish the .NET 10.0 Application
# ==============================================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Leverage Docker layer caching by copying and restoring dependencies first
COPY ["FlowSpeak.Api.csproj", "./"]
RUN dotnet restore "FlowSpeak.Api.csproj"

# Copy the remaining source files and build
COPY . .
RUN dotnet build "FlowSpeak.Api.csproj" -c Release -o /app/build

# Publish the optimized production binaries
FROM build AS publish
RUN dotnet publish "FlowSpeak.Api.csproj" -c Release -o /app/publish \
    /p:UseAppHost=false \
    /p:PublishReadyToRun=true \
    /p:PublishTrimmed=false

# ==============================================================================
# STAGE 2: Lightweight Production Runtime
# ==============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app

# Install curl/wget securely for health checks
RUN apk add --no-cache libintl libstdc++ icu-libs wget

# Secure runtime: Create a dedicated system group and user to avoid running as Root
RUN addgroup -S flowspeakgroup && adduser -S flowspeakuser -G flowspeakgroup

# Set strict ownership of application directories
COPY --from=publish --chown=flowspeakuser:flowspeakgroup /app/publish .

# Configure ASP.NET Core to bind to a non-privileged port
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Switch context to the non-root system user
USER flowspeakuser

# Setup simple health check utilizing the built-in health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

ENTRYPOINT ["dotnet", "FlowSpeak.Api.dll"]
