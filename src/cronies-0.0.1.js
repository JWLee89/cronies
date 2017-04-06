/**
 * @Author Jay Lee
 * @Version 0.0.1
 * Javascript utility belt for dealing with data.
 * */
(function() {"use strict";

    // Cache frequently used prototypes.
    var
        objProto        = Object.prototype,
        arrProto        = Array.prototype,
        croniesProto    = Cronies.prototype;

    // Frequently used methods
    var toString        = objProto.toString,
        slice           = arrProto.slice,
        hasOwnProperty  = objProto.hasOwnProperty,
        isArray         = Array.isArray || function(obj) { return objProto.toString.call(obj) === "[object Array]";},
        isObject        = function (obj) { return objProto.toString.call(obj) === "[object Object]";},
        has             = function (obj, key) { return obj !== null && hasOwnProperty.call(obj, key); },
        nativeKeys      = Object.keys,
        isObjectOrArray = function (obj) { return isArray(obj) || isObject(obj); },
        dayOfWeekArr    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    /**
     * Set the data object and the previous data object
     * 이전 결과와 새라운 결과 저장하기
     * @param result. The result of the operation that took place.
     * @this {object} Cronies object
     * */
    var setProperties = function(result) {
        var data;
        if (isObjectOrArray(this.data)) {
            data = deepCopier(this.data);
        } else {
            data = this.data;
        }
        this.previousDataRecord.push(data);
        this.previousData = data;
        this.data = result;
    };

    /**
     * 데이타 조작 되돌리기 ...
     * Reverse previous data manipulation.
     * @this {object} Cronies object
     * */
    var reverseDataManipulation = function() {
        var previousDataRecord = this.previousDataRecord;
        var len = previousDataRecord.length;
        if (len <= 0) {
            throwDetailedError("No more previous data records to pop off off 'this.previousDataRecord' ... \n\n", this, "\n");
        }
        var previousData =  previousDataRecord.pop();
        // Set previous data to previous record. Minus two since length was accessed before popping
        this.previousData = len - 2 >= 0 ? previousData[len - 2] : deepCopier(this.originalData);
        // Set current data to previous data
        this.data = previousData;
    };

    /**
     * obj parameter 는 function type 제외하고 아무거나 넣어도 된다.
     * @param obj it can be any type of variable apart from a function
     * @return {object}
     * */
    function Cronies(obj) {
        var passedValue = isObjectOrArray(obj) ? deepCopier(obj) : obj;
        if (!(this instanceof Cronies)) {
            var newCronies = new Cronies(passedValue);
            newCronies.originalData = passedValue;
            newCronies.previousDataRecord = [];
            return newCronies;
        }
        this.data = passedValue;
    }

    /**
     * Extend the cronies prototype object
     * Prototype 객채 extend
     * */
    croniesProto.extend = function extend(obj) {
        forEach(obj, function(fn, key) {
            croniesProto[key] = fn;
        });
        return this;
    };

    /**
     * 객채 (Array 또는 Object) 클론하기. return 된 객채는 이전 객채의 memory location을 참조 안 하고 있음 (영어로 deep copy)
     * @param {Object|Array} obj the object to be cloned. Object by definition here are either arrays or objects (not functions)
     * @return {Object|Array}
     * */
    function clone(obj) {
        var result;
        if (isArray(obj)) {
            result = [];
            forEach(obj, function(val, key) {
                result.push(val);
            });
        } else if (isObject(obj)) {
            result = {};
            forEach(obj, function(val, key) {
                result[key] = val;
            });
        } else {
            logError(obj + " is not an object or array ...");
        }
        return result;
    }

    /**
     * @Credit underscore.js http://underscorejs.org/
     * Functions below are almost verbatim as implemented by underscore.js
     * */
    function getKeys(obj) {
        if (!isObject(obj)) {
            return null;
        }
        if (nativeKeys) {
            return nativeKeys(obj);
        }
        var keys = [], key;
        for (key in obj) {
            if (has(obj, key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * ===================================================
     * ================= Debugging Tools =================
     * ===================================================
     * */

    /**
     * Stack trace 가져오기
     * get stack trace. Used in conjunction with throwError
     * */
    var getStackTrace = function (errMsg) {
        var err = new Error(errMsg);
        return err.stack;
    };

    /**
     * Throw error
     * */
    function throwError(errMsg) {
        throw new Error(getStackTrace(errMsg));
    }

    /**
     * 상세에러 메시지 보여주기. parameter 는 무제한 예. throwDetailedError(obj, " 에러", msg)
     * object 를 에러 메시지에 보여줄래면, string concatentation 안하고 별도의 parameter 로 pass 하세요.
     * Throw detailed error
     * */
    function throwDetailedError() {
        throw new Error(formattedLogString(slice.call(arguments)));
    }

    /**
     * Log input
     * */
    function log(input) {
        console.log(input);
    }

    /**
     * Format objects printed onto the console in a string
     * so that the whole object is displayed properly.
     * */
    function formattedLogString(args) {
        return Cronies(args).map(printObjFormatted).data.join('');
    }
    /**
     * Will make this method smarter on request
     * */
    function printObjFormatted(item) {
        return isObject(item) ? JSON.stringify(item) : item || toString.call(item);
    }

    function logArray(input) {
        console.table(input);
    }

    function logTrace(input) {
        console.trace(input);
    }

    /**
     * Log for convenience
     * */
    function logFormat(input, type) {
        switch (type) {
            case "array":
                logArray(input);
                break;
            case "trace":
                logTrace(input);
                break;
            default:
                log(input);
        }
    }

    /**
     * Log error
     * */
    function logError(errMsg) {
        log(getStackTrace(errMsg));
    }

    croniesProto.extend({
        throwError: throwDetailedError
    });

    /**
     * ===================================================
     * ============== Validation Functions ===============
     * ===================================================
     * */

    /**
     * 데이타의 실제 형을 return 한다 예: "array", "object", "number", "function"
     * Return the actual type of the object
     * @return {string}
     * */
    var typeOf = function() {
        var lastPart = objProto.toString.call(this.data).split(" ").pop();
        return lastPart.substring(0, lastPart.length - 1).toLowerCase();
    };

    /**
     * @return {Boolean}
     * */
    var isNumber = function(val) {
        return objProto.toString.call(val) === "[object Number]";
    };

    var isFunction = function(val) {
        return objProto.toString.call(val) === "[object Function]";
    };

    var isString = function(val) {
        return objProto.toString.call(val) === "[object String]";
    };

    var isDate = function(val) {
        return objProto.toString.call(val) === "[object Date]";
    };

    /**
     * 숫자같은 string 을 받으면 true return 한다. 예 "10" ==> true, "ab" ==> false
     * Return true if the passed in item is like a number E.g "10" or is a number E.g. 10.
     * Will return false if its an invalid number E.g. "01"
     * @param {String} str the item to be compared
     * @return {Boolean}
     * */
    var isNumberLike = function(str) {
        var num = Math.floor(Number(str));
        return String(num) === str && num >= 0;
    };

    /**
     * 해당 데이타가 from, to 범위에 있는지.
     * 예) isBetween(50, 0, 60) ==> true. 하지만 isBetween (50,51,60) ==> false
     *
     * @oaram {Number} num. The number to test.
     * @param {Number} from. The min value. If less than from, will return false.
     * @param {Number} to. The max value. If number exceeds this number, will return false
     * @return {Boolean} true if number is between the from and to number. Otherwise, false
     * */
    var numIsBetween = function(num, from, to) {
        if (!isNumber(num) || !isNumber(from) || !isNumber(to)) {
            throwDetailedError(num, from, to, ". One of these is not of type Number");
        }
        return num <= to && num >= from;
    };

    /**
     * Methods for manipulating the current instance of the Cronies object.
     * These methods here are not chainable and do not set any values.
     * They simply return true or false based upon the validation function used.
     * */
    croniesProto.extend({
        typeOf: function() {
            return typeOf.call(this.data);
        },
        isNumber: function() {
            return isNumber(this.data);
        },
        isNumberLike: function() {
            return isNumberLike(this.data);
        },
        isFunction: function() {
            return isFunction(this.data);
        },
        isString: function() {
            return isString(this.data);
        },
        isArray: function() {
            return isArray(this.data);
        },
        isObject: function() {
            return isObject(this.data);
        },
        isObjectOrArray: function() {
            return isObjectOrArray(this.data);
        },
        numIsBetween: function(from, to) {
            return numIsBetween(this.data, from, to);
        }
    });

    /**
     * ===================================================
     * ============== Functional Utilities ===============
     * ===================================================
     * */

    /**
     * 기본 커리잉 함수. 아직 사용안함
     * Generic currying function
     * @param {Number} argCount number of arguments that the function will be receiving
     * @return {Function}
     * */
    var genericCurry = function(argCount) {
        var _curry = function(fn) {
            var args = slice.call(arguments, 1);
            return function() {
                var combinedArg = args.concat(slice.call(arguments, 0));
                if (combinedArg.length < argCount) {
                    combinedArg.unshift(fn);
                    return _curry.apply(null, combinedArg);
                } else {
                    return fn.apply(null, combinedArg);
                }
            };
        };
        return _curry;
    };

    /**
     * TODO: Compose all the date functions inside the formatDate function
     * Generic composition function
     * @param {Function} fn1 function number 1 (to be combined with fn2)
     * @param {Function} fn2 function number 2 (to be combined with fn1)
     * @return {Function}
     * */
    var compose = function(fn1, fn2) {
        return function(variable) {
            return fn1(fn2(variable));
        };
    };

    /**
     * ===================================================
     * ================ String Functions =================
     * ===================================================
     * */

    /**
     * @this    {String} the string to operate on
     * @param   {String} stringToAppend The string that you would like to append at certain indexes
     * @return  {String}
     * */
    var appendStringAt = function(stringToAppend) {
        var args = slice.call(arguments, 1),
            data = this.split(""),                      // split string into character array
            len = data.length,
            indexCounter = 0;

        // Remove indexes that are larger than length of string
        args = Cronies(args).filter(function(index) { return index <= len; }).data;

        forEach(args, function(index) {
            var realIndex = indexCounter + index;       // as we append to string, it grows, so we need to increase index appropriately
            data.splice(realIndex, 0, stringToAppend);
            indexCounter++;                             // add one to index since our array's length is increased by one
        });
        return data.join("");
    };

    /**
     * ===================================================
     * ================ Object Functions =================
     * ===================================================
     * */

    /**
     * 객채 복사 도움이 함수
     * Helper function for copying objects
     * */
    var objectCopier = function (predicate) {
        var func = function (obj) {
            var result;
            if (isObject(obj)) {
                result = {};
            } else {
                result = [];
            }
            forEach(obj, function (curItem, key) {
                result[key] = predicate(curItem, func);
            });
            return result;
        };
        return func;
    };
    /**
     * Deep copy 하는 함수
     * Predicate wrapper for deep copying
     * @return {Object}
     * */
    var deepCopier = objectCopier(function (item, operation) {
        return isArray(item) || isObject(item)
            ? operation(item)
            : item;
    });

    /**
     * Shallow copy 하는 함수
     * Predicate wrapper for shallow copying
     * @return {Object}
     * */
    var shallowCopier = objectCopier(function (item) {
        return item;
    });

    /**
     * 현재 감싸고있는 객채와 passed in 객채 병합. 기준에 있는 property들은 덮어쓰기는 안함.
     * Merge the two objects together. Do not overwrite if property already exists in object 1
     * @param {object} obj1
     * @param {object} obj2
     * @return {object} The merged object. This will be a deep copy.
     * */
    var mergeAndNoOverwrite = function(obj1, obj2) {
        var result = clone(obj1);
        forEach(obj2, function(val, key) {
            if (!has(obj1, key)) {       // If key does not exist, overwrite
                result[key] = val;
            }
        });
        return result;
    };

    /**
     * 현재 감싸고있는 객채와 passed in 객채 병합. 겹치는 property 있으면, 새로 pass in 한 객채의 값으로
     * overwrite 하기
     * Merge the two objects together. Overwrite all the properties inside of original object
     * @param {object} obj1 original object.
     * @param {object} obj2 object that will be copied.
     * @return {object} The merged object. This will be a deep copy of properties in both objects.
     * */
    var mergeAndOverwrite = function(obj1, obj2) {
        var result = clone(obj1);
        forEach(obj2, function(val, key) {
            result[key] = val;
        });
        return result;
    };

    /**
     * 현재 감싸고있는 객채와 passed in 객채 병합
     * Merge the objects that are of the same type
     * @This Cronies object
     * @param {Object|Array} itemToMerge
     * @param {Boolean} overwriteData. If set to true, data will be overwritten.
     * @return {Object|Array}
     * */
    var merge = function (itemToMerge, overwriteData) {
        var data = this.data, result;
        if (isArray(data) && isArray(itemToMerge)) {
            if (overwriteData === true) {
                result = mergeAndOverwrite(data, itemToMerge);
            } else {
                result = this.data.concat(itemToMerge);
            }
        } else if (isObject(data) && isObject(itemToMerge)) {
            if (overwriteData === true) {
                result = mergeAndOverwrite(data, itemToMerge);
            } else {
                result = mergeAndNoOverwrite(data, itemToMerge);
            }
        } else {
            throwDetailedError(data, " and ", itemToMerge, " must be of the same type [object || array]");
        }
        return result;
    };

    /**
     * Flatten nested arrays and objects. E.g. [[0,2[3,5]], 1] ==> [0,2,3,5,1]
     * @return {Array}
     * */
    var flatten = function (data) {
        return Cronies(data).reduce(function(a,b) {
            return a.concat(isObjectOrArray(b) ? flatten(b) : b);
        },[]).getData();
    };

    /**
     * 중복데이타 제거
     * Remove duplicate data from array or object. If it is an object, user may specify a keep to examine by.
     * @return {Array|Object}
     * */
    var keepUnique = function (obj, keys) {
        var prepareMapJob = prepareIterationJob(obj, keys);
        var existingData = [];
        var result = prepareMapJob(function(val, key, object, addData) {
            if (isObjectOrArray(val)) {
                addData(flatten(keepUnique(val, keys)));
            } else if (existingData.indexOf(val) === -1) {
                existingData.push(val);
                addData(val, key);
            }
        });
        return result;
    };

    croniesProto.extend({
        unique: function(keys) {
            setProperties.call(this, keepUnique(this.data, keys));
            return this;
        },
        deepCopy: function(obj) {
            setProperties.call(this, deepCopier(obj));
            return this;
        },
        shallowCopy: function(obj) {
            setProperties.call(this, shallowCopier(obj));
            return this;
        },
        merge: function(itemToMerge) {
            setProperties.call(this, merge.call(this, itemToMerge, false));
            return this;
        },
        mergeAndOverwrite: function(itemToMerge) {
            setProperties.call(this, merge.call(this, itemToMerge,  true));
            return this;
        },
        flatten: function() {
            var arr = this.data;
            if (isObjectOrArray(arr)) {
                setProperties.call(this, flatten(arr));
            } else {
                throwDetailedError(arr, " must be an array to apply flatten()");
            }
            return this;
        }
    });

    /**
     * ===================================================
     * =============== Iterator Functions ================
     * ===================================================
     * */

    /**
     * Object/Array looping 작업 준비.
     * 1번째 parameter 는 looping 할 변수다. 이거는 Object 또는 Array 형이다
     * 2번째 parameter 는 옵션이고, 가지고 오고 싶은 key, array index를 string 형태로
     * 나열한다. Delimiter: ","
     * Prepare a functional iteration job.
     * @param {Object|Array} obj. The collection to iterate through
     * @param {String} keys. A string with a comma delimiter. E.G. key1,key2,key3
     * @return {Function}
     * */
    var prepareIterationJob = function(obj, keys) {
        var result, addData;
        if (isArray(obj)) {
            result = [];
            addData = function(val) {
                result.push(val);
            };
        } else if (isObject(obj)) {
            result = {};
            addData = function(val, key) {
                result[key] = val;
            };
        } else {
            throwDetailedError(obj, " is not an object or array ...");
        }
        return function(fn) {
            if (keys) {
                keys = keys.split(",");
                forEach(obj, function(val, key, object) {
                    forEach(keys, function(keyToLoop, index) {
                    //    if (isObjectOrArray(val)) val = deepCopier(val);        // Deep copy to prevent corrupt data
                        if (keyToLoop == key) {                                 // double equals to allow array string indexes to be interpreted as numbers
                            fn(val, key, object, addData);
                            keys.splice(index, 1);                              // Remove that index from array to prevent unnecessary work
                        }
                    });
                });
            } else {
                forEach(obj, function(val, key, object) {
                //    if (isObjectOrArray(val)) val = deepCopier(val);            // Deep copy to prevent corrupt data. Commented out. Leave it to the consumer of the function.
                    fn(val, key, object, addData);
                });
            }
            return result;
        }
    };

    /**
     * ES5 에서 사용하는 기본 forEach. 하지만 Cronies에서 사용하는 forEach는 Object 도 looping 가능하다.
     * ES5 implementation of forEach. This one will work with both objects and arrays.
     * @param {Object|Array} obj
     * @param {Function} fn
     * */
    function forEach(obj, fn) {
        var i = 0, len;
        if (isArray(obj)) {
            for (len = obj.length; i < len; i++) {
                fn(obj[i], i, obj);
            }
        } else if (isObject(obj)) {
            var keys = getKeys(obj);
            for (len = keys.length; i < len; i++) {
                fn(obj[keys[i]], keys[i], obj);
            }
        } else {
            throwDetailedError(obj, " is not an object or array ...");
        }
        return this;
    }

    /**
     * ===================================================
     * ================ String Functions =================
     * ===================================================
     * */

    /**
     * 정규식에 사용하는 특수 chracter Escape "\" 해주기
     * Adding "\" to special characters for regular expressions.
     * @param {String} regexStr
     * @return {String}
     * */
    var addEscapeToSpecialCharacters = function(regexStr) {
        return regexStr.replace(/([^\w\s])/gi, '\\$1');
    };

    /**
     * 입력된 character들 string에서 삭제해주기
     * Remove all of the following characters inside
     * @param {String} charsToRemove characters to remove from the String passed to the returned function
     * @return {Function}
     * */
    var removeCharactersFromString = function(charsToRemove) {
        charsToRemove = addEscapeToSpecialCharacters(charsToRemove || "[a-zA-Z]+");
        var regexp = new RegExp("[" +charsToRemove + "]+", 'gi');
        return function(str) {
            return str.replace(regexp, '').trim();
        };
    };

    /**
     * 1000 단위 위주로, 숫자에 comma 추가해주는 함수. 예: 1000.234 => 1,000.234
     * Format numbers and add commas between thousands. E.g. 1000.234 => 1,000.234
     * @param {Number} number to format
     * @return {String} the formatted string
     * */
    var threeCommaFormat = function(number) {
        var parts = number.toString().split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    /**
     * 아래 있는 함수들은 모두다 key parameter 가 있음.
     * key 를 지정하면, 특정 key 및 index 에 있는 값들만 가져와서 처리한다.
     * 예: "property1,property2"
     * 예: "0,1,5,7"
     * Iterator methods. All the functions below have keys as options.
     * Specify the keys to only return the values at the specific keys/index.
     * E.g. "property1,property2"
     * E.g. "0,1,5,7"
     * */
    croniesProto.extend({
        forEach: function(fn) {
            var i = 0, len, obj = this.data;
            if (isArray(obj)) {
                for (len = obj.length; i < len; i++) {
                    fn(obj[i], i, obj);
                }
            } else if (isObject(obj)) {
                var keys = getKeys(obj);
                for (len = keys.length; i < len; i++) {
                    fn(obj[keys[i]], keys[i], obj);
                }
            } else {
                throwDetailedError(obj, " is not an object or array ...");
            }
            return this;
        },
        /**
         * ES5 에서 쓰는 map, filter 함수
         * */
        map: function(fn, keys) {
            var prepareMapJob = prepareIterationJob(this.data, keys);
            var result = prepareMapJob(function(val, key, object, addData) {
                addData(fn(val, key, object), key);
            });
            setProperties.call(this, result);
            return this;
        },
        filter: function(predicate, keys) {
            var obj = this.data;
            var prepareFilterJob = prepareIterationJob(obj, keys);
            var result = prepareFilterJob(function(val, key, object, addData) {
                if (predicate(val, key, object)) {
                    addData(val, key);
                }
            });
            setProperties.call(this, result);
            return this;
        },
        reduce: function(fn, initialValue, keys) {
            var obj = this.data;
            var prepareReduceJob = prepareIterationJob(obj, keys);
            prepareReduceJob(function(val, key, object) {
                initialValue = fn(initialValue, val, key, object);
            });
            setProperties.call(this, initialValue);
            return this;
        },
        threeCommaFormat: function(keys) {
            if (isObjectOrArray(this.data)) {
                var prepareNumberFormattingJob = prepareIterationJob(this.data,  keys);
                var result = prepareNumberFormattingJob(function(val, key, object, addData) {
                    if (isNumber(val)) {
                        addData(threeCommaFormat(val), key);
                    } else {
                        addData(val, key);
                    }
                });
                setProperties.call(this, result);
            } else {
                setProperties.call(this, threeCommaFormat(this.data));
            }
            return this;
        },  // 0 하값 제거
        removeNegatives: function(keys) {
            var prepareNumberRemovingJob = prepareIterationJob(this.data, keys);
            var result = prepareNumberRemovingJob(function(val, key, object, addData) {
                if (val > 0 || !isNumber(val)) {
                    addData(val, key);
                }
            });
            setProperties.call(this, result);
            return this;
        },
        // 0보다 큰 값 제거
        removePositives: function(keys) {
            var prepareNumberRemovingJob = prepareIterationJob(this.data, keys);
            var result = prepareNumberRemovingJob(function(val, key, object, addData) {
                if (val < 0 || !isNumber(val)) {
                    addData(val, key);
                }
            });
            setProperties.call(this, result);
            return this;
        },
        // 숫자 제거
        removeNumbers: function(keys) {
            var prepareNumberRemovingJob = prepareIterationJob(this.data, keys);
            var result = prepareNumberRemovingJob(function(val, key, object, addData) {
                if (isNumber(val)) {
                    addData(val, key);
                }
            });
            setProperties.call(this, result);
            return this;
        },
        // 특정 character 들 제거
        // 예: Cronies("한글 대한항공").removeCharacters("한").data; ==> "글 대항공"
        removeCharacters: function(charToRemove, keys) {

            // Prepare job
            var removeChars =  removeCharactersFromString(charToRemove);
            var data = this.data;

            if (isObjectOrArray(data)) {
                var prepareCharacterRemovingJob = prepareIterationJob(data, keys);
                var result = prepareCharacterRemovingJob(function(val, key, object, addData) {
                    // remove characters only from string
                    if (isString(val)) {
                        addData(removeChars(val), key);
                    } else {
                        addData(val, key);
                    }
                });
                setProperties.call(this, result);
            } else if (typeof data === "string") {
                setProperties.call(this, removeChars(data));
            } else {
                logError("Unable to process invalid data format: " + data + ". Please pass in a string, Array/object of strings.");
            }
            return this;
        },
        // Javascript 에서 falsey 한값들 제거
        removeFalseyValues: function(keys) {
            var removeFalseyValueJob = prepareIterationJob(this.data, keys);
            this.data = removeFalseyValueJob(function(val, key, object, addData) {
                if (val) {
                    addData(val, key);
                }
            });
            return this;
        }
    });

    /**
     * ===================================================
     * ================= Date Functions ==================
     * ===================================================
     * */

    /**
     * Date time comparison time.
     * @param {Date} date1 the date that will be comapred with. Think of it is as the "From" time.
     * @param {Date} date2 The "To" date. The date2 time will be subtracted from the "From" time.
     * @return {Function}
     * */
    var prepareDateComparisonJob = function(date1, date2) {
        if (!isDate(date1) || !isDate(date2)) {
            throwDetailedError(date1, " and/or ", date2, " is not a javascript date object");
        }
        return function(timeInMillsecond) {
            return (date2.getTime() / timeInMillsecond) - (date1.getTime() / timeInMillsecond);
        }
    };

    /**
     * Check if its am or pm
     * */
    var isAm = function(hour) {
        return hour < 12;
    };

    croniesProto.extend({
        // customize day of week array E.g. ["Mon, "Tue", "wed", ...]
        setDayOfWeek: function(dayOfWeekArray) {
            if (isObject(dayOfWeekArray) && dayOfWeekArray.length === 7) {
                dayOfWeekArr = deepCopier(dayOfWeekArray);
            } else {
                throwDetailedError(dayOfWeekArray, " must be an array of length y. e.g. ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']");
            }
            return this;
        },
        getDayDifference: function(comparingDate) {
            var initialDate = this.data;
            var millisecondsInOneDay = 86400000;
            var result = prepareDateComparisonJob(initialDate, comparingDate)(millisecondsInOneDay);
            setProperties.call(this, result);
            return this;
        },
        // The hour difference between two dates. 두 데이트 객채의 시간차
        getHourDifference: function(comparingDate) {
            var initialDate = this.data;
            var millisecondsInOneHour = 3600000;
            var result = prepareDateComparisonJob(initialDate, comparingDate)(millisecondsInOneHour);
            setProperties.call(this, result);
            return this;
        },
        // The minute difference between two dates. 두 데이트 객채의 분차이
        getMinuteDifference: function(comparingDate) {
            var initialDate = this.data;
            var millisecondsInOneMinute = 60000;
            var result = prepareDateComparisonJob(initialDate, comparingDate)(millisecondsInOneMinute);
            setProperties.call(this, result);
            return this;
        }
    });

    /**
     * ===================================================
     * ================= Data Accessor ===================
     * ===================================================
     * */

    croniesProto.extend({
        getData: function() {
            return this.data;
        },
        backtrack: function() {
            reverseDataManipulation.call(this);
            return this;
        },
        getOriginalData: function() {
            return this.originalData
        }
    });

    /**
     * ===================================================
     * ================ String Functions =================
     * ===================================================
     * */

    /**
     * @param {String | Number} item. The subject to test and add leading characters to
     * @param {Function} predicate function.
     * @param {String} append. Characters to append as prefix
     * @return {String}
     * */
    var addLeadingCharacters = function(item, predicate, append) {
        predicate = isFunction(predicate) ? predicate(item) : item < 10;
        append    = append || "0";
        return predicate ? append + item : item;
    };

    /**
     * String 을 parsing 해서 Date 을 원하는 string format으로 변환. Javascript Date Object 하고 timestamp data 형 parsing 함.
     *
     * Follows the Java standard format found in the following link and supports the following patterns
     * http://docs.oracle.com/javase/6/docs/api/java/text/SimpleDateFormat.html
     *
     * Letter	Date or Time Component	Presentation	    Examples
     *   YYYY   Year	                    Year	        1996; 96
     *   MM	    Month in year	            Month	        July; Jul; 07
     *   ww	    Week in year	            Number	        27
     *   WW	    Week in month	            Number	        2
     *   DD	    Day in year	                Number          189
     *   dd	    Day in month	            Number	        10
     *   FF	    Day of week in month	    Number	        2
     *   EE	    Day in week	                Text	        Tuesday; Tue
     *   aa	    Am/pm marker	            Text	        PM
     *   HH	    Hour in day (0-23)	        Number	        0
     *   hh	    Hour in am/pm (1-12)	    Number	        12
     *   mm	    Minute in hour	            Number	        30
     *   ss	    Second in minute	        Number	        55
     *   SS	    Millisecond	                Number	        978
     *  @param {Date|Number} date. Javascript date object or timestamp (ms)
     *  @return {string}
     * */
    var formatDate = function (date, dateStrFormat) {
        // Change timestamp to Date
        if (isNumber(date)) {
            date = new Date(date);
        }
        // The formatted strings in array E.g. YYYY, MM, HH24, etc.
        var formatStrArr = dateStrFormat.split(/[^YYYY|MM|DD|HH|HHAA|MI|SS|WW|KK|AA|EE|FF]+/gi).filter(function(v) { return v !== ""});

        // The delimiters in the string (including spaces) such as the "/" in YYYY/MM/DD
        var suffixArr = dateStrFormat.split(/[YYYY|MM|DD|HH|HHAA|MI|SS|WW|KK|AA|EE|FF]+/gi).filter(function(v) { return v !== ""});
        var result = "";

        // curDateStr = YYYY, MM, HH24, etc.
        forEach(formatStrArr, function(curDateStr, index) {
            switch(curDateStr) {
                case "YYYY":
                    result += date.getFullYear();
                    break;
                case "MM" :
                    result += addLeadingCharacters(date.getMonth() + 1);
                    break;
                case "dd" :
                    result += addLeadingCharacters(date.getDate());
                    break;
                case "DD" :
                    var lastDayOfPrevYear = new Date(date.getFullYear(), 0, 0);
                    result += Math.floor(Cronies(lastDayOfPrevYear).getDayDifference(date).getData());
                    break;
                case "HH" :
                    result += date.getHours();
                    break;
                case "hh" :
                    var hours = date.getHours() % 12;
                    hours = hours ? hours : 12;           // if hours is zero, it should be 12
                    result += hours;
                    break;
                case "hhaa" :
                    var hourTime = date.getHours();
                    var hours = hourTime % 12;
                    hours = hours ? hours : 12;           // if hours is zero, it should be 12
                    result += (hours + (isAm(hourTime) ? "am" : "pm"));
                    break;
                case "mm" :
                    result += addLeadingCharacters(date.getMinutes());
                    break;
                case "ss" :
                    result += addLeadingCharacters(date.getSeconds());
                    break;
                case "SS" :
                    result += date.getMilliseconds();
                    break;
                case "ww" :
                    var firstDayOfYear = new Date(date.getFullYear(), 0, 1);
                    result += Math.ceil( Cronies(firstDayOfYear).getDayDifference(date).getData() / 7 );
                    break;
                case "WW" :
                    result += Math.floor(date.getDate() / 7) + 1;
                    break;
                case "FF" :
                    var firstDayOfTheMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
                    result += Math.ceil((date.getDate() + firstDayOfTheMonth) / 7);
                    break;
                case "aa" :
                    var hour = date.getHours();
                    result += hour >= 12 ? "pm" : "am";
                    break;
                case "EE" :
                    result += dayOfWeekArr[date.getDay()];
                    break;
                default:
                    logError("ERROR: " + curDateStr + " is not a parseable format. Original string: " + dateStrFormat);
            }
            result += suffixArr[index] || "";       // Add suffixes to date string
        });
        return result;
    };

    croniesProto.extend({
        formatDate: function(dateStringFormat, keys) {
            var data = this.data;
            if (isObjectOrArray(data)) {
                var prepareDateFormattingJob = prepareIterationJob(data,  keys);
                var result = prepareDateFormattingJob(function(val, key, object, addData) {
                    if (isDate(val) || isNumber(val)) {
                        addData(formatDate(val, dateStringFormat), key);
                    } else {
                        addData(val, key);
                    }
                });
                setProperties.call(this, result);
            } else {
                setProperties.call(this, formatDate(data, dateStringFormat));
            }
            return this;
        },
        /**
         * 특정위치에 string append 하기.
         * 예: Cronies("20160709").appendStringAt("-", 4, 6).data ==> "2016-07-09
         * */
        appendStringAt: function() {
            var data = this.data;
            var args = arguments;
            if (isObjectOrArray(data)) {
                var prepareStringAppendingJob = prepareIterationJob(data);
                var result = prepareStringAppendingJob(function(val, key, object, addData) {
                    if (isString(val)) {
                        addData(appendStringAt.apply(val, args), key);
                    } else {
                        addData(val, key);
                    }
                });
                setProperties.call(this, result);
            } else {
                setProperties.call(this, appendStringAt.apply(data, args));
            }
            return this;
        }
    });

    /**
     * ===================================================
     * ================ Number Functions =================
     * ===================================================
     * */

    /**
     * Prepare number job, depending on data type
     * @param target the target for the job. Can be a collection or number
     * @return {Function}
     * */
    var prepareNumberJob = function(target) {
        var returnedFunction;
        if (isObjectOrArray(target)) {
            returnedFunction = function(that, fn) {
                return Cronies(that.data).map(fn).data;
            };
        } else if (typeof target === "number") {
            returnedFunction = function(that, fn) {
                return fn(target);
            };
        } else {
            throwError(target + " is not a collection or of type number");
        }
        return returnedFunction;
    };

    var powerOf = function(num, power) {
        return Math.pow(num, power);
    };

    /**
     * 소숮점처리: dp가 2 면 소숫점 2개 보여주기
     *
     * Rounding function
     * @param numbers: number or collection of numbers to work with
     * @param {number} dp: Decimal point number. Default: to 2 decimal place
     * @return {number}
     * */
    var roundTo = function (numbers, dp) {
        var pow = powerOf(10, dp);
        var roundToJob = prepareNumberJob(numbers);
        return roundToJob(this, function(target) {
            return typeof target === "number" ?
                parseFloat(parseFloat(Math.round(target * pow) / pow).toFixed(dp)) :
                target;
        });
    };

    /**
     *  소숮점처리: dp가 2 면 정수라도 무조건 소숫점 2개 까지 보여주기 예: 125 ==> 125.00
     *
     * Rounding function. Keeps trailing zeroes and returns a string;
     * @param {number} num: number to work with
     * @param {number} dp: Decimal point number. Default: to 2 decimal place
     * @return {String}
     * */
    var roundToFixed = function(numbers, dp) {
        var pow = powerOf(10, dp);
        var roundToFixedJob = prepareNumberJob(numbers);
        return roundToFixedJob(this, function(target) {
            return typeof target === "number" ?
                parseFloat(Math.round(target * pow) / pow).toFixed(dp) :
                target;
        });
    };

    /**
     * 객채 또는 Array 의 최대값 가져오기
     *
     * Get the maximum value from collection of elements.
     * @param {Array|Object|Number} numbers a collection of numbers
     * */
    var getMax = function(numbers) {
        if (isArray(numbers)) {
            return Math.max.apply(null, numbers);
        } else if (isObject(numbers)) {
            return getKeys(numbers).reduce(function(v, k){ return numbers[k] > v ? numbers[k] : v }, -Infinity);
        }
        return numbers;
    };

    /**
     * 객채 또는 Array 의 최저값 가져오기
     *
     * Get the min value from collection of elements.
     * @param {Array|Object|Number} numbers a collection of numbers
     * */
    var getMin = function(numbers) {
        if (isArray(numbers)) {
            return Math.min.apply(null, numbers);
        } else if (isObject(numbers)) {
            return getKeys(numbers).reduce(function(v, k){ return numbers[k] < v ? numbers[k] : v }, Infinity);
        }
        return numbers;
    };

    /**
     * Append number-related functions to the Cronies prototype object.
     * */
    croniesProto.extend({
        max: function() {
            setProperties.call(this, getMax(this.data));
            return this;
        },
        min:  function() {
            setProperties.call(this, getMin(this.data));
            return this;
        },
        roundTo: function(dp) {
            dp = dp || 2;
            var data = this.data;
            setProperties.call(this, roundTo.call(this, data, dp));
            return this;
        },
        roundToFixed: function(dp) {
            dp = dp || 2;
            var data = this.data;
            setProperties.call(this, roundToFixed.call(this, data, dp));
            return this;
        }
    });

    // Expose the Cronies variable
    if (window.C === undefined) {
        window.C = Cronies;
    }
    if (window.Cronies === undefined) {
        window.Cronies = Cronies;
    } else {
        logError("Cronies is already defined");
    }

})();
