#About this application#
This simple application demonstrates how to use the Predix connector to implement a simple "smart-city" application.

#Application's components#
The application is composed the following components:
- parking: a sript (API) that uses the Predix connector to retrieve a list of parking in a specific region and that checks the availbility of each parking on the list
- map: an HTML file that uses Google's maps library to display the list of parking as marker on a map, adorned with some additiona information about their status (available or full)
