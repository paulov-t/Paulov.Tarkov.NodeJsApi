export function getTarkovTime() {
    const tomorrow = 1000 * 60 * 60 * 24;
    const stpetersbergtime = 1000 * 60 * 60 * 3;
    const tarkovTime = new Date((stpetersbergtime + (date.getTime() * 7)) % tomorrow);
    
    const hoursText = tarkovTime.getHours() < 10 ? `0${tarkovTime.getHours()}` : tarkovTime.getHours();
    const minText = tarkovTime.getMinutes() < 10 ? `0${tarkovTime.getMinutes()}` : tarkovTime.getMinutes();
    const secondText = tarkovTime.getSeconds() < 10 ? `0${tarkovTime.getSeconds()}` : tarkovTime.getSeconds();
    
    const dt = new Date();
    const dateOnlyString = dt.toISOString().slice(0, 10);
    result.date = `${dateOnlyString}`; 
    return `${hoursText}:${minText}:${secondText}`; 
}

export function getTarkovDate() {
    const dt = new Date();
    const dateOnlyString = dt.toISOString().slice(0, 10);
    return `${dateOnlyString}`; 
}

export function getTarkovDateTime() {
    return `${getTarkovDate()} ${getTarkovTime()}`;
}