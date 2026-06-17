#!/bin/bash
#
# run-demo.sh
# Description: Runs the FlowSpeak API backend.
# This script navigates to the API project directory, restores .NET dependencies,
# and then starts the application.
#
# Usage: ./run-demo.sh
#
# Ensure you have the .NET 10 SDK installed and your environment variables
# (or appsettings.json) are configured correctly.
#

echo "Starting FlowSpeak API..."
cd src/FlowSpeak.Api || exit
dotnet restore
dotnet run
echo "FlowSpeak API started. Press Ctrl+C to stop."