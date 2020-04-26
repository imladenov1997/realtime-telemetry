# realtime-telemetry
Real Time Telemetry for F1 2019 using UDP. 

It consists of a NodeJS module which accepts UDP packets from F1 2019 Official Game, as well as a InfluxDB which stores relevant data from received packets and a Grafana
platform connected to the database. 

From Grafana platform everyone can set up and create their own dashboards for showing whatever data from the game, they want. 