const { F1TelemetryClient, constants } = require('f1-telemetry-client');
const { PACKETS } = constants;
const axios = require('axios');

const client = new F1TelemetryClient();
// client.on(PACKETS.session, console.log);
// client.on(PACKETS.motion, console.log);
// client.on(PACKETS.lapData, console.log);
// client.on(PACKETS.event, console.log);
// client.on(PACKETS.participants, console.log);
// client.on(PACKETS.carSetups, console.log);
client.on(PACKETS.carTelemetry, logImportant);
// client.on(PACKETS.carStatus, console.log);

// to start listening:
client.start();

function logImportant(packet) {
    let header = packet.m_header;
    let individualData = packet.m_carTelemetryData[2];
    let someone = packet.m_carTelemetryData[3]

    compare(header, individualData, someone);
}

function addRecord(header, data_unit) {
    const url = 'http://db:8086/write?db=f1';
    let tags = 'sessionID=' + header.m_sessionUID + ",frameID=" + header.m_frameIdentifier;

    Object.keys(data_unit).filter(key => !Array.isArray(data_unit[key])).map(key => {
        let measurement = key;
        let value = 'value=' + data_unit[key];

        let final_body = measurement + ',' + tags + ' ' + value;

        axios.post(url, final_body, {
            headers: {
                'Content-Type': 'text/plain'
            }
        }).catch(function(err) {
            console.log(err)
        });
    });
}

function compare(header, individualData, someonesData) {
    const url = 'http://db:8086/write?db=f1';
    let personal = 'sessionID=' + header.m_sessionUID + ",frameID=" + header.m_frameIdentifier + ',data=individual';
    let someone = 'sessionID=' + header.m_sessionUID + ",frameID=" + header.m_frameIdentifier + ',data=someone';

    Object.keys(individualData).filter(key => !Array.isArray(individualData[key])).map(key => {
        let measurement = 'comparison' + key;
        let value = 'value=' + individualData[key];

        let final_body = measurement + ',' + personal + ' ' + value;

        axios.post(url, final_body, {
            headers: {
                'Content-Type': 'text/plain'
            }
        }).catch(function(err) {
            console.log(err)
        });
    });

    Object.keys(someonesData).filter(key => !Array.isArray(someonesData[key])).map(key => {
        let measurement = 'comparison' + key;
        let value = 'value=' + someonesData[key];

        let final_body = measurement + ',' + someone + ' ' + value;

        axios.post(url, final_body, {
            headers: {
                'Content-Type': 'text/plain'
            }
        });
    });
};