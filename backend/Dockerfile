FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SupportTicketSystem.API.csproj", "./"]
RUN dotnet restore "SupportTicketSystem.API.csproj"
COPY . .
RUN dotnet build "SupportTicketSystem.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SupportTicketSystem.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SupportTicketSystem.API.dll"]
