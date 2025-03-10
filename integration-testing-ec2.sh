#!/bin/bash

echo "Integration test...."

# Check AWS CLI version
aws --version

# Get instance data from AWS
Data=$(aws ec2 describe-instances)

echo "Data - $Data"

# Get the URL of the EC2 instance with a specific tag
URL=$(aws ec2 describe-instances | jq -r '.Reservations[].Instances[] | select(.Tags[].Value=="dev-deploy") | .PublicIpAddress')

echo "URL Data - $URL"

# Check if URL is not empty
if [[ "$URL" != '' ]]; then
    # Get HTTP status code from the server
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "http://$URL:3000/live")
    echo "HTTP Code - $http_code"

    # Send a POST request to the server
    planet_data=$(curl -s -X POST "http://$URL:3000/planet" -H "Content-Type: application/json" -d '{"id":"3"}')
    echo "Planet Data - $planet_data"

    # Extract planet name from the response
    planet_name=$(echo $planet_data | jq -r '.name')
    echo "Planet Name - $planet_name"

    # Check if the HTTP status code is 200 and the planet name is Earth
    if [[ "$http_code" -eq 200 && "$planet_name" == "Earth" ]]; then
        echo "HTTP Status Code and Planet Name Tests Passed"
    else
        echo "One or more tests failed"
        exit 1
    fi
else
    echo "Could not fetch a Token/URL; Check/Debug line 8"
    exit 1
fi
