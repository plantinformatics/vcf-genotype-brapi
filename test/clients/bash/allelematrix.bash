#!/usr/bin/env bash

#-------------------------------------------------------------------------------

export testDataDir=../../data/client

# args : endpoint jsonFile
# e.g. sendRequest allelematrix test1.json
sendRequest() {
  curl --url "$serverUrl/$1" \
       --header "Content-Type: application/json" \
       --data-binary @"$testDataDir"/"$1"/"$2" \
       --request POST \
       --insecure
}


#-------------------------------------------------------------------------------

# This script file consists of bash function definitions (above), and commands (below)
# - it can be used either via the bash "source" command or run as a bash executable script.
# If the script is sourced then the function definitions are added to the shell.
# If the script is executed then the below commands are executed.

# Test if this script is executed or sourced.
# Those actions are not done if it is sourced;  this enables this script to be used to define the function deploy in an interactive bash shell
if (return 0 2>/dev/null); then : ; else
  #---------------------------------------

  usageText="Usage e.g. : $0 -s|--server gigwa -e|--endpoint allelematrix"
  #	Parse command-line arguments
  # Based on https://www.baeldung.com/linux/bash-parse-command-line-arguments
  VALID_ARGS=$(getopt -o vs:e: --long verbose,server:,endpoint: -- "$@")
  if [[ $? -ne 0 ]]; then
    echo "$usageText" 1>&2
    exit 1;
  fi

  eval set -- "$VALID_ARGS"
  while [ : ]; do
    case "$1" in
      -v | --verbose)
        verbose=1
        shift
        ;;
      -s | --server)
        echo "Processing 'server' option. Input argument is '$2'"
        # serverDir : planning to have a suite of test json files customised for the database of each server
        case "$2" in
          gigwa)
            serverUrl="https://gigwa.plantinformatics.io/$2/rest/brapi/v2/search"
            serverDir="$2"
            ;;
          localhost)
            serverUrl="http://localhost:3000"
            serverDir="$2"
            ;;
        esac
        shift 2
        ;;
      -e | --endpoint)
        endpoint="$2"
        echo "Processing 'endpoint' option. Input argument is '$2'"
        shift 2
        ;;
      --) shift; 
          break 
          ;;
    esac
  done

  if [[ -z "$endpoint"  ]]; then
    echo "$usageText" 1>&2
    exit 1;
  else
    case "$endpoint" in
      allelematrix)
        sendRequest "$endpoint" test1.json
        ;;
      *)
        echo "$usageText" 1>&2
        exit 1;
        ;;
    esac
  fi

  #---------------------------------------
fi
#-------------------------------------------------------------------------------
