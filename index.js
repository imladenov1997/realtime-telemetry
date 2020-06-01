const { F1TelemetryClient, constants } = require('f1-telemetry-client');
const { PACKETS } = constants;
const axios = require('axios');
const fs = require('fs');

const client = new F1TelemetryClient();
client.on(PACKETS.session, getSessionData);
client.on(PACKETS.motion, getCarMotionData);
client.on(PACKETS.lapData, getLapData);
// client.on(PACKETS.event, console.log);
// client.on(PACKETS.participants, console.log);
client.on(PACKETS.carSetups, getCarSetup);
client.on(PACKETS.carTelemetry, getCarTelemetryData);
client.on(PACKETS.carStatus, getCarStatusData);

let sessionData = [];
let motionData = [];
let lapData = [];
let carSetupData = [];
let telemetryData = [];
let carStatusData = [];

let sessionHeader = null;
let motionDataHeader = null;
let lapDataHeader = null;
let carSetupDataHeader = null;
let telemetryDataHeader = null;
let carStatusDataHeader = null;

// to start listening:
client.start();

function logImportant(packet) {
    let header = packet.m_header;
    let individualData = packet.m_carTelemetryData[0];

    addRecord(header, individualData);
}

function getCarStatusData(packet) {
    let data = packet.m_carStatusData[19];
    let basicData = Object.keys(data).filter(key => typeof data[key] !== 'object');
    let dataPoint = basicData.reduce((accum, item) => {
        return accum + data[item] + ',';
    }, '');
    let tyresWear = data.m_tyresWear.join(',');
    let tyresDamage = data.m_tyresDamage.join(',');

    dataPoint += [tyresWear, tyresDamage].join(',');

    carStatusData.push(dataPoint);

    if (carStatusDataHeader == null) {
        basicData.push('tyresWear', 'tyresDamage');
        carStatusDataHeader = basicData.join(',');
    }

    console.log(dataPoint);

    return dataPoint
}


function getCarTelemetryData(packet) {
    let data = packet.m_carTelemetryData[19];
    let basicData = Object.keys(data).filter(key => typeof data[key] !== 'object');
    let dataPoint = basicData.reduce((accum, item) => {
        return accum + data[item] + ',';
    }, '');
    let m_brakesTemperature = data.m_brakesTemperature.join(',');
    let m_tyresSurfaceTemperature = data.m_tyresSurfaceTemperature.join(',');
    let tyresInnerTemperature = data.m_tyresInnerTemperature.join(',');
    let tyresPressure = data.m_tyresPressure.join(',');
    let surfaceType = data.m_surfaceType.join(',');
    let arrays = [m_brakesTemperature, m_tyresSurfaceTemperature, tyresInnerTemperature, tyresPressure, surfaceType].join(',');

    dataPoint += arrays;

    console.log('TELEMETRY');
    console.log(dataPoint);

    telemetryData.push(dataPoint);

    if (telemetryDataHeader == null) {
        basicData.push('m_brakesTemperature', 'm_tyresSurfaceTemperature', 'm_tyresInnerTemperature', 'm_tyresPressure', 'm_surfaceType');
        telemetryDataHeader = basicData.join(',');
    }

    return dataPoint;
}

function getCarSetup(packet) {
    let keys = Object.keys(packet.m_carSetups[19]);
    let lastKey = keys.pop()
    let dataPoint = keys.reduce((accum, item) => {
        return accum + packet.m_carSetups[19][item] + ',';
    }, '');
    dataPoint += packet.m_carSetups[19][lastKey];

    carSetupData.push(dataPoint);

    if (carSetupDataHeader == null) {
        keys.push('m_brakesTemperature', 'm_tyresSurfaceTemperature', 'm_tyresInnerTemperature', 'm_tyresPressure', 'm_surfaceType');
        carSetupDataHeader = keys.join(',');
    }

    console.log('CARSETUP');
    console.log(dataPoint);
}

function getLapData(packet) {
    let currentLap = packet.m_lapData[19];
    let keys = Object.keys(currentLap);
    let last = keys.pop();
    let dataPoint = keys.reduce((accum, item) => {
        return accum + currentLap[item] + ',';
    }, '');
    dataPoint += currentLap[last];

    lapData.push(dataPoint);

    if (lapDataHeader == null) {
        lapDataHeader = keys.join(',');
    }

    console.log('LAPDATA');
    console.log(dataPoint);
}

function getSessionData(packet) {
    let keys = Object.keys(packet).filter(key => typeof packet[key] !== 'object');
    let last = keys.pop();
    let dataPoint = keys.reduce((accum, item) => {
        return accum + packet[item] + ',';
    }, '');
    dataPoint += packet[last];

    sessionData.push(dataPoint);

    if (sessionHeader == null) {
        sessionHeader = keys.join(',');
    }

    console.log('SESSIONDATA');
    console.log(dataPoint);
}

function getCarMotionData(packet) {
    let keys = Object.keys(packet.m_carMotionData[19]);
    let lastKey = keys.pop()
    let dataPoint = keys.reduce((accum, item) => {
        return accum + packet.m_carMotionData[19][item] + ',';
    }, '');
    dataPoint += packet.m_carMotionData[19][lastKey];

    motionData.push(dataPoint);

    if (motionDataHeader == null) {
        motionDataHeader = keys.join(',');
    }

    console.log('MOTIONDATA');
    console.log(dataPoint);
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

process.on('SIGINT', e => {

    console.log(sessionHeader);
    console.log('==========');
    console.log(motionDataHeader);
    console.log('==========');
    console.log(lapDataHeader);
    console.log('==========');
    console.log(carSetupDataHeader);
    console.log('==========');
    console.log(telemetryDataHeader);
    console.log('==========');
    console.log(carStatusDataHeader);

    client.stop();

    let allData = [
        [sessionData, 'sessionData.csv', sessionHeader], 
        [motionData, 'motionData.csv', motionDataHeader], 
        [lapData, 'lapData.csv', lapDataHeader], 
        [carSetupData, 'carSetupData.csv', carSetupDataHeader], 
        [telemetryData, 'telemetryData.csv', telemetryDataHeader], 
        [carStatusData, 'carStatusData.csv', carStatusDataHeader]
    ];
    allData.map(data => {
        fs.appendFileSync(data[1], data[2] + '\n', console.log);
        data[0].forEach(line => fs.appendFileSync(data[1], line + '\n', console.log));
    });

    process.exit();
});