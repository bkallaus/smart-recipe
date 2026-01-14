"use client";
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
Object.defineProperty(exports, "__esModule", { value: true });
var recipes_1 = require("@/server-actions/recipes");
var react_1 = require("react");
var use_debounce_1 = require("use-debounce");
var recipe_row_1 = require("./recipe-row");
var SearchRecipes = function () {
    var _a = (0, react_1.useState)(""), searchTerm = _a[0], setSearchTerm = _a[1];
    var _b = (0, react_1.useState)([]), recentRecipes = _b[0], setRecentRecipes = _b[1];
    var _c = (0, react_1.useTransition)(), isPending = _c[0], startTransition = _c[1];
    var value = (0, use_debounce_1.useDebounce)(searchTerm, 1000)[0];
    var searchForRecipes = function (search) { return __awaiter(void 0, void 0, void 0, function () {
        var recipes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, recipes_1.searchRecipes)(search)];
                case 1:
                    recipes = _a.sent();
                    return [2 /*return*/, recipes];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        if (value) {
            startTransition(function () { return __awaiter(void 0, void 0, void 0, function () {
                var recipes;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, searchForRecipes(value)];
                        case 1:
                            recipes = _a.sent();
                            setRecentRecipes(recipes);
                            return [2 /*return*/];
                    }
                });
            }); });
        }
    }, [value]);
    return (<div>
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Search through existing recipes
              </h1>
            </div>
            <div className="flex flex-col w-full relative">
              <input type="text" placeholder="Search for recipes" className="form-search rounded-lg w-full p-4" value={searchTerm} onChange={function (e) { return setSearchTerm(e.target.value); }}/>
              {isPending && (<div className="absolute right-4 top-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"/>
                </div>)}
            </div>
          </div>
        </div>
      </section>
      <div className="p-12 md:p-24 text-center">
        {isPending ? (<div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"/>
            <span className="ml-2 text-lg">Searching...</span>
          </div>) : (<recipe_row_1.default recipes={recentRecipes}/>)}
      </div>
    </div>);
};
exports.default = SearchRecipes;
