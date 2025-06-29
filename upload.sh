#!/bin/bash
curl -s -F "file=@123.jpg" http://localhost/upload > /dev/null
echo "Done"
