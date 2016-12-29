"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var console = require("console");
var fs = require("fs");
var xml2js_1 = require("xml2js");
var _ = require("lodash");
var request = require("request-promise");
var Sling2JCR = (function () {
    function Sling2JCR(servers, logger) {
        this.servers = servers;
        this.ready = this.loginAll(servers);
        this.logger = logger || {
            info: console.log,
            error: console.error,
            warn: console.warn
        };
    }
    Sling2JCR.prototype.logSuccessResponse = function (response) {
        response = JSON.parse(response);
        this.logger.info(response['status.code'] + " " + response['status.message'] + " : " + response.title);
    };
    Sling2JCR.prototype.login = function (server, retry) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var form = "j_username=" + server.username + "&j_password=" + server.password + "&j_workspace=crx.default&j_validate=true&_charset_=utf-8";
                        request.post({
                            url: server.host + ":" + server.port + "/crx/de/j_security_check",
                            method: 'POST',
                            form: form,
                            resolveWithFullResponse: true
                        }).then(function (response) {
                            var cookie = response.headers['set-cookie'][0];
                            server.cookie = cookie;
                            _this.logger.info("Cookie for server: " + server.host + ":" + server.port + " is " + cookie);
                            resolve(server);
                        }).catch(function (error) {
                            _this.logger.error(error);
                            reject(error);
                        });
                    })];
            });
        });
    };
    Sling2JCR.prototype.loginAll = function (servers) {
        var _this = this;
        return Promise.all(servers.map(function (s) { return _this.login(s); }));
    };
    Sling2JCR.prototype.uploadFile = function (uploadPath, fileName, filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var servers, requests, responses, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ready];
                    case 1:
                        servers = _a.sent();
                        requests = servers.map(function (server) {
                            var req = request.post(server.host + ":" + server.port + "/" + uploadPath, {
                                headers: {
                                    'Cookie': server.cookie,
                                    'Accept': 'application/json'
                                }
                            });
                            var form = req.form();
                            form.append(fileName, fs.createReadStream(filePath));
                            return req;
                        });
                        return [4 /*yield*/, Promise.all(requests)];
                    case 2:
                        responses = _a.sent();
                        responses.forEach(function (r) { return _this.logSuccessResponse(r); });
                        return [2 /*return*/, responses];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error(error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Sling2JCR.prototype.getPropertiesFromNode = function (path, node) {
        var properties = [];
        for (var nodeName in node) {
            if (nodeName === '$') {
                var attributes = node['$'];
                var _loop_1 = function (attributeName) {
                    if (attributeName.search('xmlns') < 0) {
                        var attributeValue = attributes[attributeName];
                        var hasType = attributeValue.match('^{(.*)}(.*)');
                        if (hasType) {
                            var type = hasType[1];
                            var value = hasType[2];
                            var isArray = value.match('^\\[(.*)\\]$');
                            if (isArray) {
                                var values = isArray[1].split(',');
                                values.forEach(function (v) {
                                    properties.push({ name: path + "/" + attributeName, value: v });
                                });
                                properties.push({ name: path + "/" + attributeName + "@TypHint", value: type + "[]" });
                            }
                            else {
                                properties.push({ name: path + "/" + attributeName, value: value });
                                properties.push({ name: path + "/" + attributeName + "@TypeHint", value: type });
                            }
                        }
                        else {
                            properties.push({ name: path + "/" + attributeName, value: attributeValue });
                        }
                    }
                };
                for (var attributeName in attributes) {
                    _loop_1(attributeName);
                }
            }
            else if (nodeName !== '_') {
                var childNode = node[nodeName];
                properties.push({ name: path + "/" + nodeName, value: '' });
                for (var childNodeName in childNode) {
                    properties.push.apply(properties, this.getPropertiesFromNode(path + "/" + nodeName, childNode[childNodeName]));
                }
            }
        }
        return properties;
    };
    Sling2JCR.prototype.uploadNodes = function (uploadPath, filePath, currentNode, addDeleteAttribute) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var file, fileContent, root, properties_1, servers, requests, response, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        //jcr_root\apps\cq\gui\components\authoring\componentbrowser\.content.xml
                        console.log(uploadPath);
                        return [4 /*yield*/, this.readFileAsync(filePath)];
                    case 1:
                        file = _a.sent();
                        return [4 /*yield*/, this.parseFileToXmlAsync(file)];
                    case 2:
                        fileContent = _a.sent();
                        root = fileContent['jcr:root'];
                        properties_1 = this.getPropertiesFromNode("./" + currentNode, root);
                        if (addDeleteAttribute) {
                            properties_1.unshift({ name: "./" + currentNode + "@Delete", value: "delete" });
                        }
                        return [4 /*yield*/, this.ready];
                    case 3:
                        servers = _a.sent();
                        requests = servers.map(function (server) {
                            var req = request.post(server.host + ":" + server.port + "/" + uploadPath, {
                                headers: {
                                    'Cookie': server.cookie,
                                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                    'Accept': 'application/json'
                                },
                                body: properties_1.map(function (p) { return (p.name + "=" + p.value); }).join('&')
                            });
                            return req;
                        });
                        return [4 /*yield*/, Promise.all(requests)];
                    case 4:
                        response = _a.sent();
                        response.forEach(function (r) { return _this.logSuccessResponse(r); });
                        return [2 /*return*/, response];
                    case 5:
                        err_1 = _a.sent();
                        this.logger.error(err_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    Sling2JCR.prototype.howToProcessNode = function (normalizedFilePath, jcrPath, fileName, folderPath) {
        if (fileName === ".content.xml" && _.endsWith(folderPath, "_cq_dialog")) {
            var parts = _.split(jcrPath, "/");
            var uploadPath = parts.slice(0, parts.length - 2).join("/");
            var shouldDelete = fs.readdirSync(folderPath).length < 2;
            return {
                rootNode: "cq:dialog",
                uploadPath: uploadPath,
                filePath: normalizedFilePath,
                shouldDelete: shouldDelete
            };
        }
        else if (fileName === "dialog.xml") {
            var parts = _.split(jcrPath, "/");
            var uploadPath = parts.slice(0, parts.length - 1).join("/");
            return {
                rootNode: "dialog",
                uploadPath: uploadPath,
                filePath: normalizedFilePath,
                shouldDelete: true
            };
        }
        else {
            //upload as file
            return null;
        }
    };
    Sling2JCR.prototype.process = function (filePath, removeFile) {
        if (removeFile === void 0) { removeFile = false; }
        if (!filePath.indexOf('jcr_root')) {
            this.logger.info("File at " + filePath + " is not under jcr_root folder");
            return;
        }
        var normalizedFilePath = _.replace(filePath, /\\/g, '/');
        var jcrPath = normalizedFilePath.substr(normalizedFilePath.lastIndexOf('jcr_root') + 'jcr_root'.length + 1);
        var lastSlashIndex = normalizedFilePath.lastIndexOf("/");
        var containingfolder = filePath.substr(0, lastSlashIndex);
        var fileName = normalizedFilePath.substr(lastSlashIndex + 1);
        var uploadPath = jcrPath.substr(0, jcrPath.lastIndexOf("/"));
        var processNode = this.howToProcessNode(normalizedFilePath, jcrPath, fileName, containingfolder);
        if (!removeFile) {
            if (processNode) {
                this.uploadNodes(processNode.uploadPath, processNode.filePath, processNode.rootNode, processNode.shouldDelete);
            }
            else {
                this.uploadFile(uploadPath, fileName, normalizedFilePath);
            }
        }
        else {
            if (processNode) {
                this.removeNodes(processNode.uploadPath, processNode.rootNode);
            }
            else {
                this.removeFile(uploadPath + "/" + fileName);
            }
        }
    };
    Sling2JCR.prototype.removeNodes = function (jcrPath, nodeName) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var servers, requests, responses, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ready];
                    case 1:
                        servers = _a.sent();
                        requests = servers.map(function (server) {
                            var req = request.post(server.host + ":" + server.port + "/" + jcrPath, {
                                headers: {
                                    'Cookie': server.cookie,
                                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                    'Accept': 'application/json'
                                },
                                body: "./" + nodeName + "@Delete=true"
                            });
                            return req;
                        });
                        return [4 /*yield*/, Promise.all(requests)];
                    case 2:
                        responses = _a.sent();
                        responses.forEach(function (r) { return _this.logSuccessResponse(r); });
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error(error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Sling2JCR.prototype.removeFile = function (jcrPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var servers, requests, responses, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ready];
                    case 1:
                        servers = _a.sent();
                        requests = servers.map(function (server) {
                            var req = request.del(server.host + ":" + server.port + "/" + jcrPath, {
                                headers: {
                                    'Cookie': server.cookie,
                                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                    'Accept': 'application/json'
                                }
                            });
                            return req;
                        });
                        return [4 /*yield*/, Promise.all(requests)];
                    case 2:
                        responses = _a.sent();
                        console.log(responses);
                        responses.forEach(function (r) { return _this.logger.info("Deleted file : " + jcrPath); });
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.logger.error(error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Sling2JCR.prototype.readFileAsync = function (filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        fs.readFile(filename, function (err, data) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(data);
                            }
                        });
                    })];
            });
        });
    };
    Sling2JCR.prototype.parseFileToXmlAsync = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        xml2js_1.parseString(file, function (err, result) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(result);
                            }
                        });
                    })];
            });
        });
    };
    return Sling2JCR;
}());
exports.Sling2JCR = Sling2JCR;
//# sourceMappingURL=sling2jcr.js.map