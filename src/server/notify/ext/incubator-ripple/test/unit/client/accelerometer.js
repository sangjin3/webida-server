/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
describe("accelerometer", function () {
    var accelerometer = ripple('accelerometer'),
        Rotation = ripple('platform/w3c/1.0/Rotation'),
        Acceleration = ripple('platform/w3c/1.0/Acceleration'),
        event = ripple('event'),
        db = ripple('db'),
        MOCK_POSITIONINFO = {
            x: 4,
            y: 5,
            z: -9.8,
            alpha: 30,
            beta: 45,
            gamma: 90
        };

    it("test getInfo should return a valid set of values", function () {
        var info = accelerometer.getInfo();

        expect(typeof info.accelerationIncludingGravity.x).toBe("number");
        expect("number", info.accelerationIncludingGravity.y, "expected y to be a number");
        expect("number", info.accelerationIncludingGravity.z, "expected z to be a number");
    });

    it("test getInfo should return a copied object", function () {
        var info = accelerometer.getInfo();
        info.x = 123456789;
        expect(accelerometer.getInfo().x).not.toBe(info.x);
    });

    it("setInfo should update successfully", function () {
        spyOn(db, "saveObject");

        accelerometer.setInfo({
            x: MOCK_POSITIONINFO.x,
            y: MOCK_POSITIONINFO.y,
            z: MOCK_POSITIONINFO.z
        });

        var info = accelerometer.getInfo();

        expect(MOCK_POSITIONINFO.x).toBe(info.accelerationIncludingGravity.x);
        expect(MOCK_POSITIONINFO.y).toBe(info.accelerationIncludingGravity.y);
        expect(MOCK_POSITIONINFO.z).toBe(info.accelerationIncludingGravity.z);
    });

    it("should fire DeviceMotionEvent when setInfo is called", function () {
        spyOn(db, "saveObject");
        spyOn(event, "trigger");

        accelerometer.setInfo({
            x: MOCK_POSITIONINFO.x,
            y: MOCK_POSITIONINFO.y,
            z: MOCK_POSITIONINFO.z,
            alpha: MOCK_POSITIONINFO.alpha,
            beta: MOCK_POSITIONINFO.beta,
            gamma: MOCK_POSITIONINFO.gamma
        });

        var args = event.trigger.argsForCall[0],
            expected = {
                acceleration: new Acceleration(MOCK_POSITIONINFO.x, MOCK_POSITIONINFO.y, MOCK_POSITIONINFO.z),
                accelerationIncludingGravity: new Acceleration(MOCK_POSITIONINFO.x, MOCK_POSITIONINFO.y, MOCK_POSITIONINFO.z),
                rotationRate: new Rotation(0, 0, 0),
                orientation: new Rotation(MOCK_POSITIONINFO.alpha, MOCK_POSITIONINFO.beta, MOCK_POSITIONINFO.gamma)
            };

        expect(args[0]).toBe("DeviceMotionEvent");
        expect(args[1][0].accelerationIncludingGravity).toEqual(expected.accelerationIncludingGravity);
        expect(args[1][0].acceleration).toEqual(expected.acceleration);
        expect(args[1][0].rotationRate).toEqual(expected.rotationRate);
        expect(args[1][0].orientation).toEqual(expected.orientation);
        expect(args[1][0].timestamp).toEqual(jasmine.any(Number));
    });

    it("should fire DeviceOrientationEvent when setInfo is called", function () {
        spyOn(db, "saveObject");
        spyOn(event, "trigger");

        accelerometer.setInfo({
            x: MOCK_POSITIONINFO.x,
            y: MOCK_POSITIONINFO.y,
            z: MOCK_POSITIONINFO.z,
            alpha: MOCK_POSITIONINFO.alpha,
            beta: MOCK_POSITIONINFO.beta,
            gamma: MOCK_POSITIONINFO.gamma
        });

        var args = event.trigger.argsForCall[1],
            expected = {
                acceleration: new Acceleration(MOCK_POSITIONINFO.x, MOCK_POSITIONINFO.y, MOCK_POSITIONINFO.z),
                accelerationIncludingGravity: new Acceleration(MOCK_POSITIONINFO.x, MOCK_POSITIONINFO.y, MOCK_POSITIONINFO.z),
                rotationRate: new Rotation(0, 0, 0),
                orientation: new Rotation(MOCK_POSITIONINFO.alpha, MOCK_POSITIONINFO.beta, MOCK_POSITIONINFO.gamma)
            };

        expect(args[0]).toBe("DeviceOrientationEvent");
        expect(args[1][0].accelerationIncludingGravity).toEqual(expected.accelerationIncludingGravity);
        expect(args[1][0].acceleration).toEqual(expected.acceleration);
        expect(args[1][0].rotationRate).toEqual(expected.rotationRate);
        expect(args[1][0].orientation).toEqual(expected.orientation);
        expect(args[1][0].timestamp).toEqual(jasmine.any(Number));
    });

    it("test should return a valid cached object when specified", function () {
        spyOn(db, "saveObject");
        accelerometer.setInfo(8, 8, 8);

        var info = accelerometer.getInfo(true);

        expect(info.x).not.toBe(8);
        expect(info.y).not.toBe(8);
        expect(info.z).not.toBe(8);
    });

    it("test shake should update cached x value", function () {
        spyOn(db, "saveObject");
        spyOn(event, "trigger");
        spyOn(global, "setInterval").andCallFake(function (callback) {
            callback();
        });

        var initialX = 50, accelValues;
        accelerometer.setInfo(initialX, 0, 0);
        accelerometer.shake();
        accelValues = accelerometer.getInfo(true);
        expect(initialX).not.toBe(accelValues.x);
    });
});
