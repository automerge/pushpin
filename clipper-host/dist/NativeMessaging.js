"use strict";
exports.__esModule = true;
var tslib_1 = require("tslib");
var stream_1 = require("stream");
var InboundTransform = /** @class */ (function (_super) {
    tslib_1.__extends(InboundTransform, _super);
    function InboundTransform() {
        var _this = _super.call(this, { readableObjectMode: true }) || this;
        _this.buffer = Buffer.alloc(0);
        return _this;
    }
    InboundTransform.prototype._transform = function (chunk, _encoding, callback) {
        // TODO: what are the performance characteristics of this?
        this.buffer = Buffer.concat([this.buffer, chunk]);
        this.parse();
        callback();
    };
    InboundTransform.prototype.parse = function () {
        if (this.size === undefined && this.buffer.length >= 4) {
            this.size = this.buffer.readUInt32LE(0);
            this.buffer = this.buffer.slice(4);
        }
        if (this.size && this.buffer.length >= this.size) {
            var message = this.buffer.slice(0, this.size);
            this.buffer = this.buffer.slice(this.size);
            this.size = undefined;
            this.push(JSON.parse(message.toString()));
            this.parse(); // Parse the rest of the buffer
        }
    };
    return InboundTransform;
}(stream_1.Transform));
exports.InboundTransform = InboundTransform;
var OutboundTransform = /** @class */ (function (_super) {
    tslib_1.__extends(OutboundTransform, _super);
    function OutboundTransform() {
        return _super.call(this, { writableObjectMode: true }) || this;
    }
    OutboundTransform.prototype._transform = function (chunk, _encoding, callback) {
        var message = Buffer.from(JSON.stringify(chunk));
        var length = Buffer.alloc(4);
        length.writeUInt32LE(message.length, 0);
        callback(null, Buffer.concat([length, message]));
    };
    return OutboundTransform;
}(stream_1.Transform));
exports.OutboundTransform = OutboundTransform;
//# sourceMappingURL=NativeMessaging.js.map