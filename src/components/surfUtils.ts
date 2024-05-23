function getWaveDirection(deg:number) {
    if (deg === 0) {
        return 'N';
    } else if (deg > 0 && deg < 45) {
        return 'NNE';
    } else if (deg === 45) {
        return 'NE';
    } else if (deg > 45 && deg < 90) {
        return 'ENE';
    } else if (deg === 90) {
        return 'E';
    } else if (deg > 90 && deg < 135) {
        return 'ESE';
    } else if (deg === 135) {
        return 'SE';
    } else if (deg > 135 && deg < 180) {
        return 'SSE';
    } else if (deg === 180) {
        return 'S';
    } else if (deg > 180 && deg < 225) {
        return 'SSW';
    } else if (deg === 225) {
        return 'SW';
    } else if (deg > 225 && deg < 270) {
        return 'WSW';
    } else if (deg === 270) {
        return 'W';
    } else if (deg > 270 && deg < 315) {
        return 'WNW';
    } else if (deg === 315) {
        return 'NW';
    } else if (deg > 315 && deg < 360) {
        return 'NNW';
    }
}

export default getWaveDirection;