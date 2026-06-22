# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY CustomerApi.sln ./
COPY src/CustomerApi.API/CustomerApi.API.csproj src/CustomerApi.API/
COPY src/CustomerApi.Application/CustomerApi.Application.csproj src/CustomerApi.Application/
COPY src/CustomerApi.Domain/CustomerApi.Domain.csproj src/CustomerApi.Domain/
COPY src/CustomerApi.Infrastructure/CustomerApi.Infrastructure.csproj src/CustomerApi.Infrastructure/

RUN dotnet restore CustomerApi.sln

COPY src/ ./src/
RUN dotnet publish src/CustomerApi.API/CustomerApi.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Docker

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "CustomerApi.API.dll"]
