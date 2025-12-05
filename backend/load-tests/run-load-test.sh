#!/bin/bash

# Load Test Runner Script for Retail Agentic Backend
# This script simplifies running JMeter load tests with predefined scenarios

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
BASE_URL="http://localhost:8080"
TENANT_ID="tenant-1"
SCENARIO="medium"
TEST_PLAN="ProductAPI_LoadTest.jmx"

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -s, --scenario    Test scenario: light, medium, heavy, stress (default: medium)"
    echo "  -t, --test        Test plan: product, order, auth, multitenant (default: product)"
    echo "  -u, --url         Base URL (default: http://localhost:8080)"
    echo "  -i, --tenant      Tenant ID (default: tenant-1)"
    echo "  -h, --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --scenario light"
    echo "  $0 --scenario heavy --test product"
    echo "  $0 --url http://staging.example.com --scenario stress"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--scenario)
            SCENARIO="$2"
            shift 2
            ;;
        -t|--test)
            case $2 in
                product)
                    TEST_PLAN="ProductAPI_LoadTest.jmx"
                    ;;
                order)
                    TEST_PLAN="OrderAPI_LoadTest.jmx"
                    ;;
                auth)
                    TEST_PLAN="AuthAPI_LoadTest.jmx"
                    ;;
                multitenant)
                    TEST_PLAN="MultiTenant_LoadTest.jmx"
                    ;;
                *)
                    echo -e "${RED}Error: Invalid test type${NC}"
                    usage
                    ;;
            esac
            shift 2
            ;;
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -i|--tenant)
            TENANT_ID="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            ;;
    esac
done

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}Error: JMeter is not installed or not in PATH${NC}"
    echo "Please install JMeter from https://jmeter.apache.org/download_jmeter.cgi"
    exit 1
fi

# Check if test plan exists
if [ ! -f "$TEST_PLAN" ]; then
    echo -e "${RED}Error: Test plan $TEST_PLAN not found${NC}"
    exit 1
fi

# Set scenario parameters
case $SCENARIO in
    light)
        USERS=10
        RAMP_UP=10
        DURATION=60
        ;;
    medium)
        USERS=50
        RAMP_UP=30
        DURATION=300
        ;;
    heavy)
        USERS=200
        RAMP_UP=60
        DURATION=600
        ;;
    stress)
        USERS=500
        RAMP_UP=120
        DURATION=900
        ;;
    *)
        echo -e "${RED}Error: Invalid scenario${NC}"
        usage
        ;;
esac

# Create results directory if it doesn't exist
mkdir -p results

# Generate timestamp for unique result files
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_NAME="${TEST_PLAN%.jmx}_${SCENARIO}_${TIMESTAMP}"
RESULT_FILE="results/${TEST_NAME}.jtl"
REPORT_DIR="results/${TEST_NAME}_report"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Retail Agentic Load Test Runner${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Test Plan:     $TEST_PLAN"
echo "  Scenario:      $SCENARIO"
echo "  Base URL:      $BASE_URL"
echo "  Tenant ID:     $TENANT_ID"
echo "  Users:         $USERS"
echo "  Ramp-up:       ${RAMP_UP}s"
echo "  Duration:      ${DURATION}s"
echo "  Result File:   $RESULT_FILE"
echo "  Report Dir:    $REPORT_DIR"
echo ""

# Confirm before running
read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Test cancelled${NC}"
    exit 0
fi

# Check if backend is running
echo -e "${YELLOW}Checking if backend is accessible...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/actuator/health" | grep -q "200\|401"; then
    echo -e "${RED}Warning: Backend at $BASE_URL may not be running${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo -e "${GREEN}Starting load test...${NC}"
echo ""

# Run JMeter test
jmeter -n \
    -t "$TEST_PLAN" \
    -JbaseUrl="$BASE_URL" \
    -JtenantId="$TENANT_ID" \
    -Jusers="$USERS" \
    -JrampUp="$RAMP_UP" \
    -Jduration="$DURATION" \
    -l "$RESULT_FILE" \
    -e -o "$REPORT_DIR"

# Check if test was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Load test completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Results:${NC}"
    echo "  JTL File:      $RESULT_FILE"
    echo "  HTML Report:   $REPORT_DIR/index.html"
    echo ""

    # Extract and display key metrics
    if [ -f "$RESULT_FILE" ]; then
        echo -e "${YELLOW}Quick Summary:${NC}"

        # Calculate average response time
        AVG_TIME=$(awk -F',' '{if(NR>1) sum+=$2; count++} END {printf "%.0f", sum/count}' "$RESULT_FILE")
        echo "  Average Response Time: ${AVG_TIME}ms"

        # Calculate error rate
        TOTAL=$(awk 'END {print NR-1}' "$RESULT_FILE")
        ERRORS=$(awk -F',' '{if($8=="false") count++} END {print count+0}' "$RESULT_FILE")
        ERROR_RATE=$(awk "BEGIN {printf \"%.2f\", ($ERRORS/$TOTAL)*100}")
        echo "  Total Requests: $TOTAL"
        echo "  Errors: $ERRORS ($ERROR_RATE%)"

        echo ""
    fi

    # Open report in browser (optional)
    read -p "Open HTML report in browser? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "$REPORT_DIR/index.html"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "$REPORT_DIR/index.html"
        elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
            start "$REPORT_DIR/index.html"
        fi
    fi

    echo -e "${GREEN}Done!${NC}"
else
    echo -e "${RED}Load test failed!${NC}"
    exit 1
fi
