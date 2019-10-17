#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var tslib_1 = require("tslib");
var stream_1 = require("stream");
var node_ipc_1 = tslib_1.__importDefault(require("node-ipc"));
var NativeMessaging = tslib_1.__importStar(require("./NativeMessaging"));
// TODO: Handle FileServer errors.
// const htmlStream = process.stdin.pipe(new ClipperTransform())
// // TODO: 'text/html' may not be correct
// const url = await files.write(htmlStream, 0, 'text/html')
var FunctionTransform = /** @class */ (function (_super) {
    tslib_1.__extends(FunctionTransform, _super);
    function FunctionTransform(transformFn) {
        var _this = _super.call(this, { writableObjectMode: true, readableObjectMode: true }) || this;
        _this.transformFn = transformFn;
        return _this;
    }
    FunctionTransform.prototype._transform = function (chunk, _encoding, callback) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var res;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.transformFn(chunk)];
                    case 1:
                        res = _a.sent();
                        callback(null, res);
                        return [2 /*return*/];
                }
            });
        });
    };
    return FunctionTransform;
}(stream_1.Transform));
var USER = process.env.NAME || process.env.USER || process.env.USERNAME;
node_ipc_1["default"].config.silent = true;
node_ipc_1["default"].config.appspace = "pushpin." + USER + ".";
// ipc.config.maxRetries = 2
node_ipc_1["default"].config.maxConnections = 1;
node_ipc_1["default"].config.id = 'clipper';
var inboundStream = new NativeMessaging.InboundTransform();
var onMessageTransform = new FunctionTransform(onMessage);
var outboundStream = new NativeMessaging.OutboundTransform();
// TODO: `pipelien` support added node v10
stream_1.pipeline(process.stdin, inboundStream, onMessageTransform, outboundStream, process.stdout);
function onMessage(message) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = message.contentType;
                    switch (_a) {
                        case 'HTML': return [3 /*break*/, 1];
                        case 'Text': return [3 /*break*/, 3];
                        case 'Image': return [3 /*break*/, 5];
                    }
                    return [3 /*break*/, 7];
                case 1: return [4 /*yield*/, sendToPushpin(message)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 3: return [4 /*yield*/, sendToPushpin(message)];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, sendToPushpin(message)];
                case 6:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/, { type: 'Ack' }];
            }
        });
    });
}
function sendToPushpin(msg) {
    return new Promise(function (res, rej) {
        node_ipc_1["default"].connectTo('renderer', function () {
            node_ipc_1["default"].of.renderer.on('connect', function () {
                node_ipc_1["default"].of.renderer.emit('message', msg);
                // ipc.disconnect('renderer')
                res();
            });
        });
    });
}
//# sourceMappingURL=host.js.map