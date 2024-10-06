(self['webpackChunk'] = self['webpackChunk'] || []).push([["192"], {
"403": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Ep: function() { return createPath; },
  J0: function() { return invariant; },
  LX: function() { return matchPath; },
  OF: function() { return ErrorResponseImpl; },
  RQ: function() { return joinPaths; },
  WK: function() { return isRouteErrorResponse; },
  X3: function() { return AbortedDeferredError; },
  Zn: function() { return stripBasename; },
  aU: function() { return Action; },
  cP: function() { return parsePath; },
  cm: function() { return getResolveToMatches; },
  fp: function() { return matchRoutes; },
  lX: function() { return createBrowserHistory; },
  p7: function() { return createRouter; },
  pC: function() { return resolveTo; }
});
/**
 * @remix-run/router v1.19.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
////////////////////////////////////////////////////////////////////////////////
//#region Types and Constants
////////////////////////////////////////////////////////////////////////////////
/**
 * Actions represent the type of change to a location value.
 */ var Action;
(function(Action) {
    /**
   * A POP indicates a change to an arbitrary index in the history stack, such
   * as a back or forward navigation. It does not describe the direction of the
   * navigation, only that the current index changed.
   *
   * Note: This is the default action for newly created history objects.
   */ Action["Pop"] = "POP";
    /**
   * A PUSH indicates a new entry being added to the history stack, such as when
   * a link is clicked and a new page loads. When this happens, all subsequent
   * entries in the stack are lost.
   */ Action["Push"] = "PUSH";
    /**
   * A REPLACE indicates the entry at the current index in the history stack
   * being replaced by a new one.
   */ Action["Replace"] = "REPLACE";
})(Action || (Action = {}));
const PopStateEventType = "popstate";
/**
 * Memory history stores the current location in memory. It is designed for use
 * in stateful non-browser environments like tests and React Native.
 */ function createMemoryHistory(options) {
    if (options === void 0) options = {};
    let { initialEntries = [
        "/"
    ], initialIndex, v5Compat = false } = options;
    let entries; // Declare so we can access from createMemoryLocation
    entries = initialEntries.map((entry, index)=>createMemoryLocation(entry, typeof entry === "string" ? null : entry.state, index === 0 ? "default" : undefined));
    let index = clampIndex(initialIndex == null ? entries.length - 1 : initialIndex);
    let action = Action.Pop;
    let listener = null;
    function clampIndex(n) {
        return Math.min(Math.max(n, 0), entries.length - 1);
    }
    function getCurrentLocation() {
        return entries[index];
    }
    function createMemoryLocation(to, state, key) {
        if (state === void 0) state = null;
        let location = createLocation(entries ? getCurrentLocation().pathname : "/", to, state, key);
        warning(location.pathname.charAt(0) === "/", "relative pathnames are not supported in memory history: " + JSON.stringify(to));
        return location;
    }
    function createHref(to) {
        return typeof to === "string" ? to : createPath(to);
    }
    let history = {
        get index () {
            return index;
        },
        get action () {
            return action;
        },
        get location () {
            return getCurrentLocation();
        },
        createHref,
        createURL (to) {
            return new URL(createHref(to), "http://localhost");
        },
        encodeLocation (to) {
            let path = typeof to === "string" ? parsePath(to) : to;
            return {
                pathname: path.pathname || "",
                search: path.search || "",
                hash: path.hash || ""
            };
        },
        push (to, state) {
            action = Action.Push;
            let nextLocation = createMemoryLocation(to, state);
            index += 1;
            entries.splice(index, entries.length, nextLocation);
            if (v5Compat && listener) listener({
                action,
                location: nextLocation,
                delta: 1
            });
        },
        replace (to, state) {
            action = Action.Replace;
            let nextLocation = createMemoryLocation(to, state);
            entries[index] = nextLocation;
            if (v5Compat && listener) listener({
                action,
                location: nextLocation,
                delta: 0
            });
        },
        go (delta) {
            action = Action.Pop;
            let nextIndex = clampIndex(index + delta);
            let nextLocation = entries[nextIndex];
            index = nextIndex;
            if (listener) listener({
                action,
                location: nextLocation,
                delta
            });
        },
        listen (fn) {
            listener = fn;
            return ()=>{
                listener = null;
            };
        }
    };
    return history;
}
/**
 * Browser history stores the location in regular URLs. This is the standard for
 * most web apps, but it requires some configuration on the server to ensure you
 * serve the same app at multiple URLs.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#createbrowserhistory
 */ function createBrowserHistory(options) {
    if (options === void 0) options = {};
    function createBrowserLocation(window1, globalHistory) {
        let { pathname, search, hash } = window1.location;
        return createLocation("", {
            pathname,
            search,
            hash
        }, // state defaults to `null` because `window.history.state` does
        globalHistory.state && globalHistory.state.usr || null, globalHistory.state && globalHistory.state.key || "default");
    }
    function createBrowserHref(window1, to) {
        return typeof to === "string" ? to : createPath(to);
    }
    return getUrlBasedHistory(createBrowserLocation, createBrowserHref, null, options);
}
/**
 * Hash history stores the location in window.location.hash. This makes it ideal
 * for situations where you don't want to send the location to the server for
 * some reason, either because you do cannot configure it or the URL space is
 * reserved for something else.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#createhashhistory
 */ function createHashHistory(options) {
    if (options === void 0) options = {};
    function createHashLocation(window1, globalHistory) {
        let { pathname = "/", search = "", hash = "" } = parsePath(window1.location.hash.substr(1));
        // Hash URL should always have a leading / just like window.location.pathname
        // does, so if an app ends up at a route like /#something then we add a
        // leading slash so all of our path-matching behaves the same as if it would
        // in a browser router.  This is particularly important when there exists a
        // root splat route (<Route path="*">) since that matches internally against
        // "/*" and we'd expect /#something to 404 in a hash router app.
        if (!pathname.startsWith("/") && !pathname.startsWith(".")) pathname = "/" + pathname;
        return createLocation("", {
            pathname,
            search,
            hash
        }, // state defaults to `null` because `window.history.state` does
        globalHistory.state && globalHistory.state.usr || null, globalHistory.state && globalHistory.state.key || "default");
    }
    function createHashHref(window1, to) {
        let base = window1.document.querySelector("base");
        let href = "";
        if (base && base.getAttribute("href")) {
            let url = window1.location.href;
            let hashIndex = url.indexOf("#");
            href = hashIndex === -1 ? url : url.slice(0, hashIndex);
        }
        return href + "#" + (typeof to === "string" ? to : createPath(to));
    }
    function validateHashLocation(location, to) {
        warning(location.pathname.charAt(0) === "/", "relative pathnames are not supported in hash history.push(" + JSON.stringify(to) + ")");
    }
    return getUrlBasedHistory(createHashLocation, createHashHref, validateHashLocation, options);
}
function invariant(value, message) {
    if (value === false || value === null || typeof value === "undefined") throw new Error(message);
}
function warning(cond, message) {
    if (!cond) {
        // eslint-disable-next-line no-console
        if (typeof console !== "undefined") console.warn(message);
        try {
            // Welcome to debugging history!
            //
            // This error is thrown as a convenience, so you can more easily
            // find the source for a warning that appears in the console by
            // enabling "pause on exceptions" in your JavaScript debugger.
            throw new Error(message);
        // eslint-disable-next-line no-empty
        } catch (e) {}
    }
}
function createKey() {
    return Math.random().toString(36).substr(2, 8);
}
/**
 * For browser-based histories, we combine the state and key into an object
 */ function getHistoryState(location, index) {
    return {
        usr: location.state,
        key: location.key,
        idx: index
    };
}
/**
 * Creates a Location object with a unique key from the given Path
 */ function createLocation(current, to, state, key) {
    if (state === void 0) state = null;
    let location = _extends({
        pathname: typeof current === "string" ? current : current.pathname,
        search: "",
        hash: ""
    }, typeof to === "string" ? parsePath(to) : to, {
        state,
        // TODO: This could be cleaned up.  push/replace should probably just take
        // full Locations now and avoid the need to run through this flow at all
        // But that's a pretty big refactor to the current test suite so going to
        // keep as is for the time being and just let any incoming keys take precedence
        key: to && to.key || key || createKey()
    });
    return location;
}
/**
 * Creates a string URL path from the given pathname, search, and hash components.
 */ function createPath(_ref) {
    let { pathname = "/", search = "", hash = "" } = _ref;
    if (search && search !== "?") pathname += search.charAt(0) === "?" ? search : "?" + search;
    if (hash && hash !== "#") pathname += hash.charAt(0) === "#" ? hash : "#" + hash;
    return pathname;
}
/**
 * Parses a string URL path into its separate pathname, search, and hash components.
 */ function parsePath(path) {
    let parsedPath = {};
    if (path) {
        let hashIndex = path.indexOf("#");
        if (hashIndex >= 0) {
            parsedPath.hash = path.substr(hashIndex);
            path = path.substr(0, hashIndex);
        }
        let searchIndex = path.indexOf("?");
        if (searchIndex >= 0) {
            parsedPath.search = path.substr(searchIndex);
            path = path.substr(0, searchIndex);
        }
        if (path) parsedPath.pathname = path;
    }
    return parsedPath;
}
function getUrlBasedHistory(getLocation, createHref, validateLocation, options) {
    if (options === void 0) options = {};
    let { window: window1 = document.defaultView, v5Compat = false } = options;
    let globalHistory = window1.history;
    let action = Action.Pop;
    let listener = null;
    let index = getIndex();
    // Index should only be null when we initialize. If not, it's because the
    // user called history.pushState or history.replaceState directly, in which
    // case we should log a warning as it will result in bugs.
    if (index == null) {
        index = 0;
        globalHistory.replaceState(_extends({}, globalHistory.state, {
            idx: index
        }), "");
    }
    function getIndex() {
        let state = globalHistory.state || {
            idx: null
        };
        return state.idx;
    }
    function handlePop() {
        action = Action.Pop;
        let nextIndex = getIndex();
        let delta = nextIndex == null ? null : nextIndex - index;
        index = nextIndex;
        if (listener) listener({
            action,
            location: history.location,
            delta
        });
    }
    function push(to, state) {
        action = Action.Push;
        let location = createLocation(history.location, to, state);
        if (validateLocation) validateLocation(location, to);
        index = getIndex() + 1;
        let historyState = getHistoryState(location, index);
        let url = history.createHref(location);
        // try...catch because iOS limits us to 100 pushState calls :/
        try {
            globalHistory.pushState(historyState, "", url);
        } catch (error) {
            // If the exception is because `state` can't be serialized, let that throw
            // outwards just like a replace call would so the dev knows the cause
            // https://html.spec.whatwg.org/multipage/nav-history-apis.html#shared-history-push/replace-state-steps
            // https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal
            if (error instanceof DOMException && error.name === "DataCloneError") throw error;
            // They are going to lose state here, but there is no real
            // way to warn them about it since the page will refresh...
            window1.location.assign(url);
        }
        if (v5Compat && listener) listener({
            action,
            location: history.location,
            delta: 1
        });
    }
    function replace(to, state) {
        action = Action.Replace;
        let location = createLocation(history.location, to, state);
        if (validateLocation) validateLocation(location, to);
        index = getIndex();
        let historyState = getHistoryState(location, index);
        let url = history.createHref(location);
        globalHistory.replaceState(historyState, "", url);
        if (v5Compat && listener) listener({
            action,
            location: history.location,
            delta: 0
        });
    }
    function createURL(to) {
        // window.location.origin is "null" (the literal string value) in Firefox
        // under certain conditions, notably when serving from a local HTML file
        // See https://bugzilla.mozilla.org/show_bug.cgi?id=878297
        let base = window1.location.origin !== "null" ? window1.location.origin : window1.location.href;
        let href = typeof to === "string" ? to : createPath(to);
        // Treating this as a full URL will strip any trailing spaces so we need to
        // pre-encode them since they might be part of a matching splat param from
        // an ancestor route
        href = href.replace(/ $/, "%20");
        invariant(base, "No window.location.(origin|href) available to create URL for href: " + href);
        return new URL(href, base);
    }
    let history = {
        get action () {
            return action;
        },
        get location () {
            return getLocation(window1, globalHistory);
        },
        listen (fn) {
            if (listener) throw new Error("A history only accepts one active listener");
            window1.addEventListener(PopStateEventType, handlePop);
            listener = fn;
            return ()=>{
                window1.removeEventListener(PopStateEventType, handlePop);
                listener = null;
            };
        },
        createHref (to) {
            return createHref(window1, to);
        },
        createURL,
        encodeLocation (to) {
            // Encode a Location the same way window.location would
            let url = createURL(to);
            return {
                pathname: url.pathname,
                search: url.search,
                hash: url.hash
            };
        },
        push,
        replace,
        go (n) {
            return globalHistory.go(n);
        }
    };
    return history;
}
//#endregion
var ResultType;
(function(ResultType) {
    ResultType["data"] = "data";
    ResultType["deferred"] = "deferred";
    ResultType["redirect"] = "redirect";
    ResultType["error"] = "error";
})(ResultType || (ResultType = {}));
const immutableRouteKeys = new Set([
    "lazy",
    "caseSensitive",
    "path",
    "id",
    "index",
    "children"
]);
function isIndexRoute(route) {
    return route.index === true;
}
// Walk the route tree generating unique IDs where necessary, so we are working
// solely with AgnosticDataRouteObject's within the Router
function convertRoutesToDataRoutes(routes, mapRouteProperties, parentPath, manifest) {
    if (parentPath === void 0) parentPath = [];
    if (manifest === void 0) manifest = {};
    return routes.map((route, index)=>{
        let treePath = [
            ...parentPath,
            String(index)
        ];
        let id = typeof route.id === "string" ? route.id : treePath.join("-");
        invariant(route.index !== true || !route.children, "Cannot specify children on an index route");
        invariant(!manifest[id], "Found a route id collision on id \"" + id + "\".  Route " + "id's must be globally unique within Data Router usages");
        if (isIndexRoute(route)) {
            let indexRoute = _extends({}, route, mapRouteProperties(route), {
                id
            });
            manifest[id] = indexRoute;
            return indexRoute;
        } else {
            let pathOrLayoutRoute = _extends({}, route, mapRouteProperties(route), {
                id,
                children: undefined
            });
            manifest[id] = pathOrLayoutRoute;
            if (route.children) pathOrLayoutRoute.children = convertRoutesToDataRoutes(route.children, mapRouteProperties, treePath, manifest);
            return pathOrLayoutRoute;
        }
    });
}
/**
 * Matches the given routes to a location and returns the match data.
 *
 * @see https://reactrouter.com/utils/match-routes
 */ function matchRoutes(routes, locationArg, basename) {
    if (basename === void 0) basename = "/";
    return matchRoutesImpl(routes, locationArg, basename, false);
}
function matchRoutesImpl(routes, locationArg, basename, allowPartial) {
    let location = typeof locationArg === "string" ? parsePath(locationArg) : locationArg;
    let pathname = stripBasename(location.pathname || "/", basename);
    if (pathname == null) return null;
    let branches = flattenRoutes(routes);
    rankRouteBranches(branches);
    let matches = null;
    for(let i = 0; matches == null && i < branches.length; ++i){
        // Incoming pathnames are generally encoded from either window.location
        // or from router.navigate, but we want to match against the unencoded
        // paths in the route definitions.  Memory router locations won't be
        // encoded here but there also shouldn't be anything to decode so this
        // should be a safe operation.  This avoids needing matchRoutes to be
        // history-aware.
        let decoded = decodePath(pathname);
        matches = matchRouteBranch(branches[i], decoded, allowPartial);
    }
    return matches;
}
function convertRouteMatchToUiMatch(match, loaderData) {
    let { route, pathname, params } = match;
    return {
        id: route.id,
        pathname,
        params,
        data: loaderData[route.id],
        handle: route.handle
    };
}
function flattenRoutes(routes, branches, parentsMeta, parentPath) {
    if (branches === void 0) branches = [];
    if (parentsMeta === void 0) parentsMeta = [];
    if (parentPath === void 0) parentPath = "";
    let flattenRoute = (route, index, relativePath)=>{
        let meta = {
            relativePath: relativePath === undefined ? route.path || "" : relativePath,
            caseSensitive: route.caseSensitive === true,
            childrenIndex: index,
            route
        };
        if (meta.relativePath.startsWith("/")) {
            invariant(meta.relativePath.startsWith(parentPath), "Absolute route path \"" + meta.relativePath + "\" nested under path " + ("\"" + parentPath + "\" is not valid. An absolute child route path ") + "must start with the combined path of all its parent routes.");
            meta.relativePath = meta.relativePath.slice(parentPath.length);
        }
        let path = joinPaths([
            parentPath,
            meta.relativePath
        ]);
        let routesMeta = parentsMeta.concat(meta);
        // Add the children before adding this route to the array, so we traverse the
        // route tree depth-first and child routes appear before their parents in
        // the "flattened" version.
        if (route.children && route.children.length > 0) {
            invariant(// Our types know better, but runtime JS may not!
            // @ts-expect-error
            route.index !== true, "Index routes must not have child routes. Please remove " + ("all child routes from route path \"" + path + "\"."));
            flattenRoutes(route.children, branches, routesMeta, path);
        }
        // Routes without a path shouldn't ever match by themselves unless they are
        // index routes, so don't add them to the list of possible branches.
        if (route.path == null && !route.index) return;
        branches.push({
            path,
            score: computeScore(path, route.index),
            routesMeta
        });
    };
    routes.forEach((route, index)=>{
        var _route$path;
        // coarse-grain check for optional params
        if (route.path === "" || !((_route$path = route.path) != null && _route$path.includes("?"))) flattenRoute(route, index);
        else for (let exploded of explodeOptionalSegments(route.path))flattenRoute(route, index, exploded);
    });
    return branches;
}
/**
 * Computes all combinations of optional path segments for a given path,
 * excluding combinations that are ambiguous and of lower priority.
 *
 * For example, `/one/:two?/three/:four?/:five?` explodes to:
 * - `/one/three`
 * - `/one/:two/three`
 * - `/one/three/:four`
 * - `/one/three/:five`
 * - `/one/:two/three/:four`
 * - `/one/:two/three/:five`
 * - `/one/three/:four/:five`
 * - `/one/:two/three/:four/:five`
 */ function explodeOptionalSegments(path) {
    let segments = path.split("/");
    if (segments.length === 0) return [];
    let [first, ...rest] = segments;
    // Optional path segments are denoted by a trailing `?`
    let isOptional = first.endsWith("?");
    // Compute the corresponding required segment: `foo?` -> `foo`
    let required = first.replace(/\?$/, "");
    if (rest.length === 0) // Intepret empty string as omitting an optional segment
    // `["one", "", "three"]` corresponds to omitting `:two` from `/one/:two?/three` -> `/one/three`
    return isOptional ? [
        required,
        ""
    ] : [
        required
    ];
    let restExploded = explodeOptionalSegments(rest.join("/"));
    let result = [];
    // All child paths with the prefix.  Do this for all children before the
    // optional version for all children, so we get consistent ordering where the
    // parent optional aspect is preferred as required.  Otherwise, we can get
    // child sections interspersed where deeper optional segments are higher than
    // parent optional segments, where for example, /:two would explode _earlier_
    // then /:one.  By always including the parent as required _for all children_
    // first, we avoid this issue
    result.push(...restExploded.map((subpath)=>subpath === "" ? required : [
            required,
            subpath
        ].join("/")));
    // Then, if this is an optional value, add all child versions without
    if (isOptional) result.push(...restExploded);
    // for absolute paths, ensure `/` instead of empty segment
    return result.map((exploded)=>path.startsWith("/") && exploded === "" ? "/" : exploded);
}
function rankRouteBranches(branches) {
    branches.sort((a, b)=>a.score !== b.score ? b.score - a.score // Higher score first
         : compareIndexes(a.routesMeta.map((meta)=>meta.childrenIndex), b.routesMeta.map((meta)=>meta.childrenIndex)));
}
const paramRe = /^:[\w-]+$/;
const dynamicSegmentValue = 3;
const indexRouteValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s)=>s === "*";
function computeScore(path, index) {
    let segments = path.split("/");
    let initialScore = segments.length;
    if (segments.some(isSplat)) initialScore += splatPenalty;
    if (index) initialScore += indexRouteValue;
    return segments.filter((s)=>!isSplat(s)).reduce((score, segment)=>score + (paramRe.test(segment) ? dynamicSegmentValue : segment === "" ? emptySegmentValue : staticSegmentValue), initialScore);
}
function compareIndexes(a, b) {
    let siblings = a.length === b.length && a.slice(0, -1).every((n, i)=>n === b[i]);
    return siblings ? // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.
    a[a.length - 1] - b[b.length - 1] : // Otherwise, it doesn't really make sense to rank non-siblings by index,
    // so they sort equally.
    0;
}
function matchRouteBranch(branch, pathname, allowPartial) {
    if (allowPartial === void 0) allowPartial = false;
    let { routesMeta } = branch;
    let matchedParams = {};
    let matchedPathname = "/";
    let matches = [];
    for(let i = 0; i < routesMeta.length; ++i){
        let meta = routesMeta[i];
        let end = i === routesMeta.length - 1;
        let remainingPathname = matchedPathname === "/" ? pathname : pathname.slice(matchedPathname.length) || "/";
        let match = matchPath({
            path: meta.relativePath,
            caseSensitive: meta.caseSensitive,
            end
        }, remainingPathname);
        let route = meta.route;
        if (!match && end && allowPartial && !routesMeta[routesMeta.length - 1].route.index) match = matchPath({
            path: meta.relativePath,
            caseSensitive: meta.caseSensitive,
            end: false
        }, remainingPathname);
        if (!match) return null;
        Object.assign(matchedParams, match.params);
        matches.push({
            // TODO: Can this as be avoided?
            params: matchedParams,
            pathname: joinPaths([
                matchedPathname,
                match.pathname
            ]),
            pathnameBase: normalizePathname(joinPaths([
                matchedPathname,
                match.pathnameBase
            ])),
            route
        });
        if (match.pathnameBase !== "/") matchedPathname = joinPaths([
            matchedPathname,
            match.pathnameBase
        ]);
    }
    return matches;
}
/**
 * Returns a path with params interpolated.
 *
 * @see https://reactrouter.com/utils/generate-path
 */ function generatePath(originalPath, params) {
    if (params === void 0) params = {};
    let path = originalPath;
    if (path.endsWith("*") && path !== "*" && !path.endsWith("/*")) {
        warning(false, "Route path \"" + path + "\" will be treated as if it were " + ("\"" + path.replace(/\*$/, "/*") + "\" because the `*` character must ") + "always follow a `/` in the pattern. To get rid of this warning, " + ("please change the route path to \"" + path.replace(/\*$/, "/*") + "\"."));
        path = path.replace(/\*$/, "/*");
    }
    // ensure `/` is added at the beginning if the path is absolute
    const prefix = path.startsWith("/") ? "/" : "";
    const stringify = (p)=>p == null ? "" : typeof p === "string" ? p : String(p);
    const segments = path.split(/\/+/).map((segment, index, array)=>{
        const isLastSegment = index === array.length - 1;
        // only apply the splat if it's the last segment
        if (isLastSegment && segment === "*") {
            const star = "*";
            // Apply the splat
            return stringify(params[star]);
        }
        const keyMatch = segment.match(/^:([\w-]+)(\??)$/);
        if (keyMatch) {
            const [, key, optional] = keyMatch;
            let param = params[key];
            invariant(optional === "?" || param != null, "Missing \":" + key + "\" param");
            return stringify(param);
        }
        // Remove any optional markers from optional static segments
        return segment.replace(/\?$/g, "");
    })// Remove empty segments
    .filter((segment)=>!!segment);
    return prefix + segments.join("/");
}
/**
 * Performs pattern matching on a URL pathname and returns information about
 * the match.
 *
 * @see https://reactrouter.com/utils/match-path
 */ function matchPath(pattern, pathname) {
    if (typeof pattern === "string") pattern = {
        path: pattern,
        caseSensitive: false,
        end: true
    };
    let [matcher, compiledParams] = compilePath(pattern.path, pattern.caseSensitive, pattern.end);
    let match = pathname.match(matcher);
    if (!match) return null;
    let matchedPathname = match[0];
    let pathnameBase = matchedPathname.replace(/(.)\/+$/, "$1");
    let captureGroups = match.slice(1);
    let params = compiledParams.reduce((memo, _ref, index)=>{
        let { paramName, isOptional } = _ref;
        // We need to compute the pathnameBase here using the raw splat value
        // instead of using params["*"] later because it will be decoded then
        if (paramName === "*") {
            let splatValue = captureGroups[index] || "";
            pathnameBase = matchedPathname.slice(0, matchedPathname.length - splatValue.length).replace(/(.)\/+$/, "$1");
        }
        const value = captureGroups[index];
        if (isOptional && !value) memo[paramName] = undefined;
        else memo[paramName] = (value || "").replace(/%2F/g, "/");
        return memo;
    }, {});
    return {
        params,
        pathname: matchedPathname,
        pathnameBase,
        pattern
    };
}
function compilePath(path, caseSensitive, end) {
    if (caseSensitive === void 0) caseSensitive = false;
    if (end === void 0) end = true;
    warning(path === "*" || !path.endsWith("*") || path.endsWith("/*"), "Route path \"" + path + "\" will be treated as if it were " + ("\"" + path.replace(/\*$/, "/*") + "\" because the `*` character must ") + "always follow a `/` in the pattern. To get rid of this warning, " + ("please change the route path to \"" + path.replace(/\*$/, "/*") + "\"."));
    let params = [];
    let regexpSource = "^" + path.replace(/\/*\*?$/, "") // Ignore trailing / and /*, we'll handle it below
    .replace(/^\/*/, "/") // Make sure it has a leading /
    .replace(/[\\.*+^${}|()[\]]/g, "\\$&") // Escape special regex chars
    .replace(/\/:([\w-]+)(\?)?/g, (_, paramName, isOptional)=>{
        params.push({
            paramName,
            isOptional: isOptional != null
        });
        return isOptional ? "/?([^\\/]+)?" : "/([^\\/]+)";
    });
    if (path.endsWith("*")) {
        params.push({
            paramName: "*"
        });
        regexpSource += path === "*" || path === "/*" ? "(.*)$" // Already matched the initial /, just match the rest
         : "(?:\\/(.+)|\\/*)$"; // Don't include the / in params["*"]
    } else if (end) // When matching to the end, ignore trailing slashes
    regexpSource += "\\/*$";
    else if (path !== "" && path !== "/") // If our path is non-empty and contains anything beyond an initial slash,
    // then we have _some_ form of path in our regex, so we should expect to
    // match only if we find the end of this path segment.  Look for an optional
    // non-captured trailing slash (to match a portion of the URL) or the end
    // of the path (if we've matched to the end).  We used to do this with a
    // word boundary but that gives false positives on routes like
    // /user-preferences since `-` counts as a word boundary.
    regexpSource += "(?:(?=\\/|$))";
    let matcher = new RegExp(regexpSource, caseSensitive ? undefined : "i");
    return [
        matcher,
        params
    ];
}
function decodePath(value) {
    try {
        return value.split("/").map((v)=>decodeURIComponent(v).replace(/\//g, "%2F")).join("/");
    } catch (error) {
        warning(false, "The URL path \"" + value + "\" could not be decoded because it is is a " + "malformed URL segment. This is probably due to a bad percent " + ("encoding (" + error + ")."));
        return value;
    }
}
/**
 * @private
 */ function stripBasename(pathname, basename) {
    if (basename === "/") return pathname;
    if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) return null;
    // We want to leave trailing slash behavior in the user's control, so if they
    // specify a basename with a trailing slash, we should support it
    let startIndex = basename.endsWith("/") ? basename.length - 1 : basename.length;
    let nextChar = pathname.charAt(startIndex);
    if (nextChar && nextChar !== "/") // pathname does not start with basename/
    return null;
    return pathname.slice(startIndex) || "/";
}
/**
 * Returns a resolved path object relative to the given pathname.
 *
 * @see https://reactrouter.com/utils/resolve-path
 */ function resolvePath(to, fromPathname) {
    if (fromPathname === void 0) fromPathname = "/";
    let { pathname: toPathname, search = "", hash = "" } = typeof to === "string" ? parsePath(to) : to;
    let pathname = toPathname ? toPathname.startsWith("/") ? toPathname : resolvePathname(toPathname, fromPathname) : fromPathname;
    return {
        pathname,
        search: normalizeSearch(search),
        hash: normalizeHash(hash)
    };
}
function resolvePathname(relativePath, fromPathname) {
    let segments = fromPathname.replace(/\/+$/, "").split("/");
    let relativeSegments = relativePath.split("/");
    relativeSegments.forEach((segment)=>{
        if (segment === "..") // Keep the root "" segment so the pathname starts at /
        {
            if (segments.length > 1) segments.pop();
        } else if (segment !== ".") segments.push(segment);
    });
    return segments.length > 1 ? segments.join("/") : "/";
}
function getInvalidPathError(char, field, dest, path) {
    return "Cannot include a '" + char + "' character in a manually specified " + ("`to." + field + "` field [" + JSON.stringify(path) + "].  Please separate it out to the ") + ("`to." + dest + "` field. Alternatively you may provide the full path as ") + "a string in <Link to=\"...\"> and the router will parse it for you.";
}
/**
 * @private
 *
 * When processing relative navigation we want to ignore ancestor routes that
 * do not contribute to the path, such that index/pathless layout routes don't
 * interfere.
 *
 * For example, when moving a route element into an index route and/or a
 * pathless layout route, relative link behavior contained within should stay
 * the same.  Both of the following examples should link back to the root:
 *
 *   <Route path="/">
 *     <Route path="accounts" element={<Link to=".."}>
 *   </Route>
 *
 *   <Route path="/">
 *     <Route path="accounts">
 *       <Route element={<AccountsLayout />}>       // <-- Does not contribute
 *         <Route index element={<Link to=".."} />  // <-- Does not contribute
 *       </Route
 *     </Route>
 *   </Route>
 */ function getPathContributingMatches(matches) {
    return matches.filter((match, index)=>index === 0 || match.route.path && match.route.path.length > 0);
}
// Return the array of pathnames for the current route matches - used to
// generate the routePathnames input for resolveTo()
function getResolveToMatches(matches, v7_relativeSplatPath) {
    let pathMatches = getPathContributingMatches(matches);
    // When v7_relativeSplatPath is enabled, use the full pathname for the leaf
    // match so we include splat values for "." links.  See:
    // https://github.com/remix-run/react-router/issues/11052#issuecomment-1836589329
    if (v7_relativeSplatPath) return pathMatches.map((match, idx)=>idx === pathMatches.length - 1 ? match.pathname : match.pathnameBase);
    return pathMatches.map((match)=>match.pathnameBase);
}
/**
 * @private
 */ function resolveTo(toArg, routePathnames, locationPathname, isPathRelative) {
    if (isPathRelative === void 0) isPathRelative = false;
    let to;
    if (typeof toArg === "string") to = parsePath(toArg);
    else {
        to = _extends({}, toArg);
        invariant(!to.pathname || !to.pathname.includes("?"), getInvalidPathError("?", "pathname", "search", to));
        invariant(!to.pathname || !to.pathname.includes("#"), getInvalidPathError("#", "pathname", "hash", to));
        invariant(!to.search || !to.search.includes("#"), getInvalidPathError("#", "search", "hash", to));
    }
    let isEmptyPath = toArg === "" || to.pathname === "";
    let toPathname = isEmptyPath ? "/" : to.pathname;
    let from;
    // Routing is relative to the current pathname if explicitly requested.
    //
    // If a pathname is explicitly provided in `to`, it should be relative to the
    // route context. This is explained in `Note on `<Link to>` values` in our
    // migration guide from v5 as a means of disambiguation between `to` values
    // that begin with `/` and those that do not. However, this is problematic for
    // `to` values that do not provide a pathname. `to` can simply be a search or
    // hash string, in which case we should assume that the navigation is relative
    // to the current location's pathname and *not* the route pathname.
    if (toPathname == null) from = locationPathname;
    else {
        let routePathnameIndex = routePathnames.length - 1;
        // With relative="route" (the default), each leading .. segment means
        // "go up one route" instead of "go up one URL segment".  This is a key
        // difference from how <a href> works and a major reason we call this a
        // "to" value instead of a "href".
        if (!isPathRelative && toPathname.startsWith("..")) {
            let toSegments = toPathname.split("/");
            while(toSegments[0] === ".."){
                toSegments.shift();
                routePathnameIndex -= 1;
            }
            to.pathname = toSegments.join("/");
        }
        from = routePathnameIndex >= 0 ? routePathnames[routePathnameIndex] : "/";
    }
    let path = resolvePath(to, from);
    // Ensure the pathname has a trailing slash if the original "to" had one
    let hasExplicitTrailingSlash = toPathname && toPathname !== "/" && toPathname.endsWith("/");
    // Or if this was a link to the current path which has a trailing slash
    let hasCurrentTrailingSlash = (isEmptyPath || toPathname === ".") && locationPathname.endsWith("/");
    if (!path.pathname.endsWith("/") && (hasExplicitTrailingSlash || hasCurrentTrailingSlash)) path.pathname += "/";
    return path;
}
/**
 * @private
 */ function getToPathname(to) {
    // Empty strings should be treated the same as / paths
    return to === "" || to.pathname === "" ? "/" : typeof to === "string" ? parsePath(to).pathname : to.pathname;
}
/**
 * @private
 */ const joinPaths = (paths)=>paths.join("/").replace(/\/\/+/g, "/");
/**
 * @private
 */ const normalizePathname = (pathname)=>pathname.replace(/\/+$/, "").replace(/^\/*/, "/");
/**
 * @private
 */ const normalizeSearch = (search)=>!search || search === "?" ? "" : search.startsWith("?") ? search : "?" + search;
/**
 * @private
 */ const normalizeHash = (hash)=>!hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;
/**
 * This is a shortcut for creating `application/json` responses. Converts `data`
 * to JSON and sets the `Content-Type` header.
 */ const json = function json(data, init) {
    if (init === void 0) init = {};
    let responseInit = typeof init === "number" ? {
        status: init
    } : init;
    let headers = new Headers(responseInit.headers);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(data), _extends({}, responseInit, {
        headers
    }));
};
class DataWithResponseInit {
    constructor(data, init){
        this.type = "DataWithResponseInit";
        this.data = data;
        this.init = init || null;
    }
}
/**
 * Create "responses" that contain `status`/`headers` without forcing
 * serialization into an actual `Response` - used by Remix single fetch
 */ function data(data, init) {
    return new DataWithResponseInit(data, typeof init === "number" ? {
        status: init
    } : init);
}
class AbortedDeferredError extends Error {
}
class DeferredData {
    constructor(data, responseInit){
        this.pendingKeysSet = new Set();
        this.subscribers = new Set();
        this.deferredKeys = [];
        invariant(data && typeof data === "object" && !Array.isArray(data), "defer() only accepts plain objects");
        // Set up an AbortController + Promise we can race against to exit early
        // cancellation
        let reject;
        this.abortPromise = new Promise((_, r)=>reject = r);
        this.controller = new AbortController();
        let onAbort = ()=>reject(new AbortedDeferredError("Deferred data aborted"));
        this.unlistenAbortSignal = ()=>this.controller.signal.removeEventListener("abort", onAbort);
        this.controller.signal.addEventListener("abort", onAbort);
        this.data = Object.entries(data).reduce((acc, _ref2)=>{
            let [key, value] = _ref2;
            return Object.assign(acc, {
                [key]: this.trackPromise(key, value)
            });
        }, {});
        if (this.done) // All incoming values were resolved
        this.unlistenAbortSignal();
        this.init = responseInit;
    }
    trackPromise(key, value) {
        if (!(value instanceof Promise)) return value;
        this.deferredKeys.push(key);
        this.pendingKeysSet.add(key);
        // We store a little wrapper promise that will be extended with
        // _data/_error props upon resolve/reject
        let promise = Promise.race([
            value,
            this.abortPromise
        ]).then((data)=>this.onSettle(promise, key, undefined, data), (error)=>this.onSettle(promise, key, error));
        // Register rejection listeners to avoid uncaught promise rejections on
        // errors or aborted deferred values
        promise.catch(()=>{});
        Object.defineProperty(promise, "_tracked", {
            get: ()=>true
        });
        return promise;
    }
    onSettle(promise, key, error, data) {
        if (this.controller.signal.aborted && error instanceof AbortedDeferredError) {
            this.unlistenAbortSignal();
            Object.defineProperty(promise, "_error", {
                get: ()=>error
            });
            return Promise.reject(error);
        }
        this.pendingKeysSet.delete(key);
        if (this.done) // Nothing left to abort!
        this.unlistenAbortSignal();
        // If the promise was resolved/rejected with undefined, we'll throw an error as you
        // should always resolve with a value or null
        if (error === undefined && data === undefined) {
            let undefinedError = new Error("Deferred data for key \"" + key + "\" resolved/rejected with `undefined`, " + "you must resolve/reject with a value or `null`.");
            Object.defineProperty(promise, "_error", {
                get: ()=>undefinedError
            });
            this.emit(false, key);
            return Promise.reject(undefinedError);
        }
        if (data === undefined) {
            Object.defineProperty(promise, "_error", {
                get: ()=>error
            });
            this.emit(false, key);
            return Promise.reject(error);
        }
        Object.defineProperty(promise, "_data", {
            get: ()=>data
        });
        this.emit(false, key);
        return data;
    }
    emit(aborted, settledKey) {
        this.subscribers.forEach((subscriber)=>subscriber(aborted, settledKey));
    }
    subscribe(fn) {
        this.subscribers.add(fn);
        return ()=>this.subscribers.delete(fn);
    }
    cancel() {
        this.controller.abort();
        this.pendingKeysSet.forEach((v, k)=>this.pendingKeysSet.delete(k));
        this.emit(true);
    }
    async resolveData(signal) {
        let aborted = false;
        if (!this.done) {
            let onAbort = ()=>this.cancel();
            signal.addEventListener("abort", onAbort);
            aborted = await new Promise((resolve)=>{
                this.subscribe((aborted)=>{
                    signal.removeEventListener("abort", onAbort);
                    if (aborted || this.done) resolve(aborted);
                });
            });
        }
        return aborted;
    }
    get done() {
        return this.pendingKeysSet.size === 0;
    }
    get unwrappedData() {
        invariant(this.data !== null && this.done, "Can only unwrap data on initialized and settled deferreds");
        return Object.entries(this.data).reduce((acc, _ref3)=>{
            let [key, value] = _ref3;
            return Object.assign(acc, {
                [key]: unwrapTrackedPromise(value)
            });
        }, {});
    }
    get pendingKeys() {
        return Array.from(this.pendingKeysSet);
    }
}
function isTrackedPromise(value) {
    return value instanceof Promise && value._tracked === true;
}
function unwrapTrackedPromise(value) {
    if (!isTrackedPromise(value)) return value;
    if (value._error) throw value._error;
    return value._data;
}
const defer = function defer(data, init) {
    if (init === void 0) init = {};
    let responseInit = typeof init === "number" ? {
        status: init
    } : init;
    return new DeferredData(data, responseInit);
};
/**
 * A redirect response. Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */ const redirect = function redirect(url, init) {
    if (init === void 0) init = 302;
    let responseInit = init;
    if (typeof responseInit === "number") responseInit = {
        status: responseInit
    };
    else if (typeof responseInit.status === "undefined") responseInit.status = 302;
    let headers = new Headers(responseInit.headers);
    headers.set("Location", url);
    return new Response(null, _extends({}, responseInit, {
        headers
    }));
};
/**
 * A redirect response that will force a document reload to the new location.
 * Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */ const redirectDocument = (url, init)=>{
    let response = redirect(url, init);
    response.headers.set("X-Remix-Reload-Document", "true");
    return response;
};
/**
 * A redirect response that will perform a `history.replaceState` instead of a
 * `history.pushState` for client-side navigation redirects.
 * Sets the status code and the `Location` header.
 * Defaults to "302 Found".
 */ const replace = (url, init)=>{
    let response = redirect(url, init);
    response.headers.set("X-Remix-Replace", "true");
    return response;
};
/**
 * @private
 * Utility class we use to hold auto-unwrapped 4xx/5xx Response bodies
 *
 * We don't export the class for public use since it's an implementation
 * detail, but we export the interface above so folks can build their own
 * abstractions around instances via isRouteErrorResponse()
 */ class ErrorResponseImpl {
    constructor(status, statusText, data, internal){
        if (internal === void 0) internal = false;
        this.status = status;
        this.statusText = statusText || "";
        this.internal = internal;
        if (data instanceof Error) {
            this.data = data.toString();
            this.error = data;
        } else this.data = data;
    }
}
/**
 * Check if the given error is an ErrorResponse generated from a 4xx/5xx
 * Response thrown from an action/loader
 */ function isRouteErrorResponse(error) {
    return error != null && typeof error.status === "number" && typeof error.statusText === "string" && typeof error.internal === "boolean" && "data" in error;
}
const validMutationMethodsArr = [
    "post",
    "put",
    "patch",
    "delete"
];
const validMutationMethods = new Set(validMutationMethodsArr);
const validRequestMethodsArr = [
    "get",
    ...validMutationMethodsArr
];
const validRequestMethods = new Set(validRequestMethodsArr);
const redirectStatusCodes = new Set([
    301,
    302,
    303,
    307,
    308
]);
const redirectPreserveMethodStatusCodes = new Set([
    307,
    308
]);
const IDLE_NAVIGATION = {
    state: "idle",
    location: undefined,
    formMethod: undefined,
    formAction: undefined,
    formEncType: undefined,
    formData: undefined,
    json: undefined,
    text: undefined
};
const IDLE_FETCHER = {
    state: "idle",
    data: undefined,
    formMethod: undefined,
    formAction: undefined,
    formEncType: undefined,
    formData: undefined,
    json: undefined,
    text: undefined
};
const IDLE_BLOCKER = {
    state: "unblocked",
    proceed: undefined,
    reset: undefined,
    location: undefined
};
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const defaultMapRouteProperties = (route)=>({
        hasErrorBoundary: Boolean(route.hasErrorBoundary)
    });
const TRANSITIONS_STORAGE_KEY = "remix-router-transitions";
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region createRouter
////////////////////////////////////////////////////////////////////////////////
/**
 * Create a router and listen to history POP navigations
 */ function createRouter(init) {
    const routerWindow = init.window ? init.window : typeof window !== "undefined" ? window : undefined;
    const isBrowser = typeof routerWindow !== "undefined" && typeof routerWindow.document !== "undefined" && typeof routerWindow.document.createElement !== "undefined";
    const isServer = !isBrowser;
    invariant(init.routes.length > 0, "You must provide a non-empty routes array to createRouter");
    let mapRouteProperties;
    if (init.mapRouteProperties) mapRouteProperties = init.mapRouteProperties;
    else if (init.detectErrorBoundary) {
        // If they are still using the deprecated version, wrap it with the new API
        let detectErrorBoundary = init.detectErrorBoundary;
        mapRouteProperties = (route)=>({
                hasErrorBoundary: detectErrorBoundary(route)
            });
    } else mapRouteProperties = defaultMapRouteProperties;
    // Routes keyed by ID
    let manifest = {};
    // Routes in tree format for matching
    let dataRoutes = convertRoutesToDataRoutes(init.routes, mapRouteProperties, undefined, manifest);
    let inFlightDataRoutes;
    let basename = init.basename || "/";
    let dataStrategyImpl = init.unstable_dataStrategy || defaultDataStrategy;
    let patchRoutesOnNavigationImpl = init.unstable_patchRoutesOnNavigation;
    // Config driven behavior flags
    let future = _extends({
        v7_fetcherPersist: false,
        v7_normalizeFormMethod: false,
        v7_partialHydration: false,
        v7_prependBasename: false,
        v7_relativeSplatPath: false,
        v7_skipActionErrorRevalidation: false
    }, init.future);
    // Cleanup function for history
    let unlistenHistory = null;
    // Externally-provided functions to call on all state changes
    let subscribers = new Set();
    // FIFO queue of previously discovered routes to prevent re-calling on
    // subsequent navigations to the same path
    let discoveredRoutesMaxSize = 1000;
    let discoveredRoutes = new Set();
    // Externally-provided object to hold scroll restoration locations during routing
    let savedScrollPositions = null;
    // Externally-provided function to get scroll restoration keys
    let getScrollRestorationKey = null;
    // Externally-provided function to get current scroll position
    let getScrollPosition = null;
    // One-time flag to control the initial hydration scroll restoration.  Because
    // we don't get the saved positions from <ScrollRestoration /> until _after_
    // the initial render, we need to manually trigger a separate updateState to
    // send along the restoreScrollPosition
    // Set to true if we have `hydrationData` since we assume we were SSR'd and that
    // SSR did the initial scroll restoration.
    let initialScrollRestored = init.hydrationData != null;
    let initialMatches = matchRoutes(dataRoutes, init.history.location, basename);
    let initialErrors = null;
    if (initialMatches == null && !patchRoutesOnNavigationImpl) {
        // If we do not match a user-provided-route, fall back to the root
        // to allow the error boundary to take over
        let error = getInternalRouterError(404, {
            pathname: init.history.location.pathname
        });
        let { matches, route } = getShortCircuitMatches(dataRoutes);
        initialMatches = matches;
        initialErrors = {
            [route.id]: error
        };
    }
    // In SPA apps, if the user provided a patchRoutesOnNavigation implementation and
    // our initial match is a splat route, clear them out so we run through lazy
    // discovery on hydration in case there's a more accurate lazy route match.
    // In SSR apps (with `hydrationData`), we expect that the server will send
    // up the proper matched routes so we don't want to run lazy discovery on
    // initial hydration and want to hydrate into the splat route.
    if (initialMatches && !init.hydrationData) {
        let fogOfWar = checkFogOfWar(initialMatches, dataRoutes, init.history.location.pathname);
        if (fogOfWar.active) initialMatches = null;
    }
    let initialized;
    if (!initialMatches) {
        initialized = false;
        initialMatches = [];
        // If partial hydration and fog of war is enabled, we will be running
        // `patchRoutesOnNavigation` during hydration so include any partial matches as
        // the initial matches so we can properly render `HydrateFallback`'s
        if (future.v7_partialHydration) {
            let fogOfWar = checkFogOfWar(null, dataRoutes, init.history.location.pathname);
            if (fogOfWar.active && fogOfWar.matches) initialMatches = fogOfWar.matches;
        }
    } else if (initialMatches.some((m)=>m.route.lazy)) // All initialMatches need to be loaded before we're ready.  If we have lazy
    // functions around still then we'll need to run them in initialize()
    initialized = false;
    else if (!initialMatches.some((m)=>m.route.loader)) // If we've got no loaders to run, then we're good to go
    initialized = true;
    else if (future.v7_partialHydration) {
        // If partial hydration is enabled, we're initialized so long as we were
        // provided with hydrationData for every route with a loader, and no loaders
        // were marked for explicit hydration
        let loaderData = init.hydrationData ? init.hydrationData.loaderData : null;
        let errors = init.hydrationData ? init.hydrationData.errors : null;
        let isRouteInitialized = (m)=>{
            // No loader, nothing to initialize
            if (!m.route.loader) return true;
            // Explicitly opting-in to running on hydration
            if (typeof m.route.loader === "function" && m.route.loader.hydrate === true) return false;
            // Otherwise, initialized if hydrated with data or an error
            return loaderData && loaderData[m.route.id] !== undefined || errors && errors[m.route.id] !== undefined;
        };
        // If errors exist, don't consider routes below the boundary
        if (errors) {
            let idx = initialMatches.findIndex((m)=>errors[m.route.id] !== undefined);
            initialized = initialMatches.slice(0, idx + 1).every(isRouteInitialized);
        } else initialized = initialMatches.every(isRouteInitialized);
    } else // Without partial hydration - we're initialized if we were provided any
    // hydrationData - which is expected to be complete
    initialized = init.hydrationData != null;
    let router;
    let state = {
        historyAction: init.history.action,
        location: init.history.location,
        matches: initialMatches,
        initialized,
        navigation: IDLE_NAVIGATION,
        // Don't restore on initial updateState() if we were SSR'd
        restoreScrollPosition: init.hydrationData != null ? false : null,
        preventScrollReset: false,
        revalidation: "idle",
        loaderData: init.hydrationData && init.hydrationData.loaderData || {},
        actionData: init.hydrationData && init.hydrationData.actionData || null,
        errors: init.hydrationData && init.hydrationData.errors || initialErrors,
        fetchers: new Map(),
        blockers: new Map()
    };
    // -- Stateful internal variables to manage navigations --
    // Current navigation in progress (to be committed in completeNavigation)
    let pendingAction = Action.Pop;
    // Should the current navigation prevent the scroll reset if scroll cannot
    // be restored?
    let pendingPreventScrollReset = false;
    // AbortController for the active navigation
    let pendingNavigationController;
    // Should the current navigation enable document.startViewTransition?
    let pendingViewTransitionEnabled = false;
    // Store applied view transitions so we can apply them on POP
    let appliedViewTransitions = new Map();
    // Cleanup function for persisting applied transitions to sessionStorage
    let removePageHideEventListener = null;
    // We use this to avoid touching history in completeNavigation if a
    // revalidation is entirely uninterrupted
    let isUninterruptedRevalidation = false;
    // Use this internal flag to force revalidation of all loaders:
    //  - submissions (completed or interrupted)
    //  - useRevalidator()
    //  - X-Remix-Revalidate (from redirect)
    let isRevalidationRequired = false;
    // Use this internal array to capture routes that require revalidation due
    // to a cancelled deferred on action submission
    let cancelledDeferredRoutes = [];
    // Use this internal array to capture fetcher loads that were cancelled by an
    // action navigation and require revalidation
    let cancelledFetcherLoads = new Set();
    // AbortControllers for any in-flight fetchers
    let fetchControllers = new Map();
    // Track loads based on the order in which they started
    let incrementingLoadId = 0;
    // Track the outstanding pending navigation data load to be compared against
    // the globally incrementing load when a fetcher load lands after a completed
    // navigation
    let pendingNavigationLoadId = -1;
    // Fetchers that triggered data reloads as a result of their actions
    let fetchReloadIds = new Map();
    // Fetchers that triggered redirect navigations
    let fetchRedirectIds = new Set();
    // Most recent href/match for fetcher.load calls for fetchers
    let fetchLoadMatches = new Map();
    // Ref-count mounted fetchers so we know when it's ok to clean them up
    let activeFetchers = new Map();
    // Fetchers that have requested a delete when using v7_fetcherPersist,
    // they'll be officially removed after they return to idle
    let deletedFetchers = new Set();
    // Store DeferredData instances for active route matches.  When a
    // route loader returns defer() we stick one in here.  Then, when a nested
    // promise resolves we update loaderData.  If a new navigation starts we
    // cancel active deferreds for eliminated routes.
    let activeDeferreds = new Map();
    // Store blocker functions in a separate Map outside of router state since
    // we don't need to update UI state if they change
    let blockerFunctions = new Map();
    // Map of pending patchRoutesOnNavigation() promises (keyed by path/matches) so
    // that we only kick them off once for a given combo
    let pendingPatchRoutes = new Map();
    // Flag to ignore the next history update, so we can revert the URL change on
    // a POP navigation that was blocked by the user without touching router state
    let unblockBlockerHistoryUpdate = undefined;
    // Initialize the router, all side effects should be kicked off from here.
    // Implemented as a Fluent API for ease of:
    //   let router = createRouter(init).initialize();
    function initialize() {
        // If history informs us of a POP navigation, start the navigation but do not update
        // state.  We'll update our own state once the navigation completes
        unlistenHistory = init.history.listen((_ref)=>{
            let { action: historyAction, location, delta } = _ref;
            // Ignore this event if it was just us resetting the URL from a
            // blocked POP navigation
            if (unblockBlockerHistoryUpdate) {
                unblockBlockerHistoryUpdate();
                unblockBlockerHistoryUpdate = undefined;
                return;
            }
            warning(blockerFunctions.size === 0 || delta != null, "You are trying to use a blocker on a POP navigation to a location that was not created by @remix-run/router. This will fail silently in production. This can happen if you are navigating outside the router via `window.history.pushState`/`window.location.hash` instead of using router navigation APIs.  This can also happen if you are using createHashRouter and the user manually changes the URL.");
            let blockerKey = shouldBlockNavigation({
                currentLocation: state.location,
                nextLocation: location,
                historyAction
            });
            if (blockerKey && delta != null) {
                // Restore the URL to match the current UI, but don't update router state
                let nextHistoryUpdatePromise = new Promise((resolve)=>{
                    unblockBlockerHistoryUpdate = resolve;
                });
                init.history.go(delta * -1);
                // Put the blocker into a blocked state
                updateBlocker(blockerKey, {
                    state: "blocked",
                    location,
                    proceed () {
                        updateBlocker(blockerKey, {
                            state: "proceeding",
                            proceed: undefined,
                            reset: undefined,
                            location
                        });
                        // Re-do the same POP navigation we just blocked, after the url
                        // restoration is also complete.  See:
                        // https://github.com/remix-run/react-router/issues/11613
                        nextHistoryUpdatePromise.then(()=>init.history.go(delta));
                    },
                    reset () {
                        let blockers = new Map(state.blockers);
                        blockers.set(blockerKey, IDLE_BLOCKER);
                        updateState({
                            blockers
                        });
                    }
                });
                return;
            }
            return startNavigation(historyAction, location);
        });
        if (isBrowser) {
            // FIXME: This feels gross.  How can we cleanup the lines between
            // scrollRestoration/appliedTransitions persistance?
            restoreAppliedTransitions(routerWindow, appliedViewTransitions);
            let _saveAppliedTransitions = ()=>persistAppliedTransitions(routerWindow, appliedViewTransitions);
            routerWindow.addEventListener("pagehide", _saveAppliedTransitions);
            removePageHideEventListener = ()=>routerWindow.removeEventListener("pagehide", _saveAppliedTransitions);
        }
        // Kick off initial data load if needed.  Use Pop to avoid modifying history
        // Note we don't do any handling of lazy here.  For SPA's it'll get handled
        // in the normal navigation flow.  For SSR it's expected that lazy modules are
        // resolved prior to router creation since we can't go into a fallbackElement
        // UI for SSR'd apps
        if (!state.initialized) startNavigation(Action.Pop, state.location, {
            initialHydration: true
        });
        return router;
    }
    // Clean up a router and it's side effects
    function dispose() {
        if (unlistenHistory) unlistenHistory();
        if (removePageHideEventListener) removePageHideEventListener();
        subscribers.clear();
        pendingNavigationController && pendingNavigationController.abort();
        state.fetchers.forEach((_, key)=>deleteFetcher(key));
        state.blockers.forEach((_, key)=>deleteBlocker(key));
    }
    // Subscribe to state updates for the router
    function subscribe(fn) {
        subscribers.add(fn);
        return ()=>subscribers.delete(fn);
    }
    // Update our state and notify the calling context of the change
    function updateState(newState, opts) {
        if (opts === void 0) opts = {};
        state = _extends({}, state, newState);
        // Prep fetcher cleanup so we can tell the UI which fetcher data entries
        // can be removed
        let completedFetchers = [];
        let deletedFetchersKeys = [];
        if (future.v7_fetcherPersist) state.fetchers.forEach((fetcher, key)=>{
            if (fetcher.state === "idle") {
                if (deletedFetchers.has(key)) // Unmounted from the UI and can be totally removed
                deletedFetchersKeys.push(key);
                else // Returned to idle but still mounted in the UI, so semi-remains for
                // revalidations and such
                completedFetchers.push(key);
            }
        });
        // Iterate over a local copy so that if flushSync is used and we end up
        // removing and adding a new subscriber due to the useCallback dependencies,
        // we don't get ourselves into a loop calling the new subscriber immediately
        [
            ...subscribers
        ].forEach((subscriber)=>subscriber(state, {
                deletedFetchers: deletedFetchersKeys,
                unstable_viewTransitionOpts: opts.viewTransitionOpts,
                unstable_flushSync: opts.flushSync === true
            }));
        // Remove idle fetchers from state since we only care about in-flight fetchers.
        if (future.v7_fetcherPersist) {
            completedFetchers.forEach((key)=>state.fetchers.delete(key));
            deletedFetchersKeys.forEach((key)=>deleteFetcher(key));
        }
    }
    // Complete a navigation returning the state.navigation back to the IDLE_NAVIGATION
    // and setting state.[historyAction/location/matches] to the new route.
    // - Location is a required param
    // - Navigation will always be set to IDLE_NAVIGATION
    // - Can pass any other state in newState
    function completeNavigation(location, newState, _temp) {
        var _location$state, _location$state2;
        let { flushSync } = _temp === void 0 ? {} : _temp;
        // Deduce if we're in a loading/actionReload state:
        // - We have committed actionData in the store
        // - The current navigation was a mutation submission
        // - We're past the submitting state and into the loading state
        // - The location being loaded is not the result of a redirect
        let isActionReload = state.actionData != null && state.navigation.formMethod != null && isMutationMethod(state.navigation.formMethod) && state.navigation.state === "loading" && ((_location$state = location.state) == null ? void 0 : _location$state._isRedirect) !== true;
        let actionData;
        if (newState.actionData) {
            if (Object.keys(newState.actionData).length > 0) actionData = newState.actionData;
            else // Empty actionData -> clear prior actionData due to an action error
            actionData = null;
        } else if (isActionReload) // Keep the current data if we're wrapping up the action reload
        actionData = state.actionData;
        else // Clear actionData on any other completed navigations
        actionData = null;
        // Always preserve any existing loaderData from re-used routes
        let loaderData = newState.loaderData ? mergeLoaderData(state.loaderData, newState.loaderData, newState.matches || [], newState.errors) : state.loaderData;
        // On a successful navigation we can assume we got through all blockers
        // so we can start fresh
        let blockers = state.blockers;
        if (blockers.size > 0) {
            blockers = new Map(blockers);
            blockers.forEach((_, k)=>blockers.set(k, IDLE_BLOCKER));
        }
        // Always respect the user flag.  Otherwise don't reset on mutation
        // submission navigations unless they redirect
        let preventScrollReset = pendingPreventScrollReset === true || state.navigation.formMethod != null && isMutationMethod(state.navigation.formMethod) && ((_location$state2 = location.state) == null ? void 0 : _location$state2._isRedirect) !== true;
        // Commit any in-flight routes at the end of the HMR revalidation "navigation"
        if (inFlightDataRoutes) {
            dataRoutes = inFlightDataRoutes;
            inFlightDataRoutes = undefined;
        }
        if (isUninterruptedRevalidation) ;
        else if (pendingAction === Action.Pop) ;
        else if (pendingAction === Action.Push) init.history.push(location, location.state);
        else if (pendingAction === Action.Replace) init.history.replace(location, location.state);
        let viewTransitionOpts;
        // On POP, enable transitions if they were enabled on the original navigation
        if (pendingAction === Action.Pop) {
            // Forward takes precedence so they behave like the original navigation
            let priorPaths = appliedViewTransitions.get(state.location.pathname);
            if (priorPaths && priorPaths.has(location.pathname)) viewTransitionOpts = {
                currentLocation: state.location,
                nextLocation: location
            };
            else if (appliedViewTransitions.has(location.pathname)) // If we don't have a previous forward nav, assume we're popping back to
            // the new location and enable if that location previously enabled
            viewTransitionOpts = {
                currentLocation: location,
                nextLocation: state.location
            };
        } else if (pendingViewTransitionEnabled) {
            // Store the applied transition on PUSH/REPLACE
            let toPaths = appliedViewTransitions.get(state.location.pathname);
            if (toPaths) toPaths.add(location.pathname);
            else {
                toPaths = new Set([
                    location.pathname
                ]);
                appliedViewTransitions.set(state.location.pathname, toPaths);
            }
            viewTransitionOpts = {
                currentLocation: state.location,
                nextLocation: location
            };
        }
        updateState(_extends({}, newState, {
            actionData,
            loaderData,
            historyAction: pendingAction,
            location,
            initialized: true,
            navigation: IDLE_NAVIGATION,
            revalidation: "idle",
            restoreScrollPosition: getSavedScrollPosition(location, newState.matches || state.matches),
            preventScrollReset,
            blockers
        }), {
            viewTransitionOpts,
            flushSync: flushSync === true
        });
        // Reset stateful navigation vars
        pendingAction = Action.Pop;
        pendingPreventScrollReset = false;
        pendingViewTransitionEnabled = false;
        isUninterruptedRevalidation = false;
        isRevalidationRequired = false;
        cancelledDeferredRoutes = [];
    }
    // Trigger a navigation event, which can either be a numerical POP or a PUSH
    // replace with an optional submission
    async function navigate(to, opts) {
        if (typeof to === "number") {
            init.history.go(to);
            return;
        }
        let normalizedPath = normalizeTo(state.location, state.matches, basename, future.v7_prependBasename, to, future.v7_relativeSplatPath, opts == null ? void 0 : opts.fromRouteId, opts == null ? void 0 : opts.relative);
        let { path, submission, error } = normalizeNavigateOptions(future.v7_normalizeFormMethod, false, normalizedPath, opts);
        let currentLocation = state.location;
        let nextLocation = createLocation(state.location, path, opts && opts.state);
        // When using navigate as a PUSH/REPLACE we aren't reading an already-encoded
        // URL from window.location, so we need to encode it here so the behavior
        // remains the same as POP and non-data-router usages.  new URL() does all
        // the same encoding we'd get from a history.pushState/window.location read
        // without having to touch history
        nextLocation = _extends({}, nextLocation, init.history.encodeLocation(nextLocation));
        let userReplace = opts && opts.replace != null ? opts.replace : undefined;
        let historyAction = Action.Push;
        if (userReplace === true) historyAction = Action.Replace;
        else if (userReplace === false) ;
        else if (submission != null && isMutationMethod(submission.formMethod) && submission.formAction === state.location.pathname + state.location.search) // By default on submissions to the current location we REPLACE so that
        // users don't have to double-click the back button to get to the prior
        // location.  If the user redirects to a different location from the
        // action/loader this will be ignored and the redirect will be a PUSH
        historyAction = Action.Replace;
        let preventScrollReset = opts && "preventScrollReset" in opts ? opts.preventScrollReset === true : undefined;
        let flushSync = (opts && opts.unstable_flushSync) === true;
        let blockerKey = shouldBlockNavigation({
            currentLocation,
            nextLocation,
            historyAction
        });
        if (blockerKey) {
            // Put the blocker into a blocked state
            updateBlocker(blockerKey, {
                state: "blocked",
                location: nextLocation,
                proceed () {
                    updateBlocker(blockerKey, {
                        state: "proceeding",
                        proceed: undefined,
                        reset: undefined,
                        location: nextLocation
                    });
                    // Send the same navigation through
                    navigate(to, opts);
                },
                reset () {
                    let blockers = new Map(state.blockers);
                    blockers.set(blockerKey, IDLE_BLOCKER);
                    updateState({
                        blockers
                    });
                }
            });
            return;
        }
        return await startNavigation(historyAction, nextLocation, {
            submission,
            // Send through the formData serialization error if we have one so we can
            // render at the right error boundary after we match routes
            pendingError: error,
            preventScrollReset,
            replace: opts && opts.replace,
            enableViewTransition: opts && opts.unstable_viewTransition,
            flushSync
        });
    }
    // Revalidate all current loaders.  If a navigation is in progress or if this
    // is interrupted by a navigation, allow this to "succeed" by calling all
    // loaders during the next loader round
    function revalidate() {
        interruptActiveLoads();
        updateState({
            revalidation: "loading"
        });
        // If we're currently submitting an action, we don't need to start a new
        // navigation, we'll just let the follow up loader execution call all loaders
        if (state.navigation.state === "submitting") return;
        // If we're currently in an idle state, start a new navigation for the current
        // action/location and mark it as uninterrupted, which will skip the history
        // update in completeNavigation
        if (state.navigation.state === "idle") {
            startNavigation(state.historyAction, state.location, {
                startUninterruptedRevalidation: true
            });
            return;
        }
        // Otherwise, if we're currently in a loading state, just start a new
        // navigation to the navigation.location but do not trigger an uninterrupted
        // revalidation so that history correctly updates once the navigation completes
        startNavigation(pendingAction || state.historyAction, state.navigation.location, {
            overrideNavigation: state.navigation,
            // Proxy through any rending view transition
            enableViewTransition: pendingViewTransitionEnabled === true
        });
    }
    // Start a navigation to the given action/location.  Can optionally provide a
    // overrideNavigation which will override the normalLoad in the case of a redirect
    // navigation
    async function startNavigation(historyAction, location, opts) {
        // Abort any in-progress navigations and start a new one. Unset any ongoing
        // uninterrupted revalidations unless told otherwise, since we want this
        // new navigation to update history normally
        pendingNavigationController && pendingNavigationController.abort();
        pendingNavigationController = null;
        pendingAction = historyAction;
        isUninterruptedRevalidation = (opts && opts.startUninterruptedRevalidation) === true;
        // Save the current scroll position every time we start a new navigation,
        // and track whether we should reset scroll on completion
        saveScrollPosition(state.location, state.matches);
        pendingPreventScrollReset = (opts && opts.preventScrollReset) === true;
        pendingViewTransitionEnabled = (opts && opts.enableViewTransition) === true;
        let routesToUse = inFlightDataRoutes || dataRoutes;
        let loadingNavigation = opts && opts.overrideNavigation;
        let matches = matchRoutes(routesToUse, location, basename);
        let flushSync = (opts && opts.flushSync) === true;
        let fogOfWar = checkFogOfWar(matches, routesToUse, location.pathname);
        if (fogOfWar.active && fogOfWar.matches) matches = fogOfWar.matches;
        // Short circuit with a 404 on the root error boundary if we match nothing
        if (!matches) {
            let { error, notFoundMatches, route } = handleNavigational404(location.pathname);
            completeNavigation(location, {
                matches: notFoundMatches,
                loaderData: {},
                errors: {
                    [route.id]: error
                }
            }, {
                flushSync
            });
            return;
        }
        // Short circuit if it's only a hash change and not a revalidation or
        // mutation submission.
        //
        // Ignore on initial page loads because since the initial load will always
        // be "same hash".  For example, on /page#hash and submit a <Form method="post">
        // which will default to a navigation to /page
        if (state.initialized && !isRevalidationRequired && isHashChangeOnly(state.location, location) && !(opts && opts.submission && isMutationMethod(opts.submission.formMethod))) {
            completeNavigation(location, {
                matches
            }, {
                flushSync
            });
            return;
        }
        // Create a controller/Request for this navigation
        pendingNavigationController = new AbortController();
        let request = createClientSideRequest(init.history, location, pendingNavigationController.signal, opts && opts.submission);
        let pendingActionResult;
        if (opts && opts.pendingError) // If we have a pendingError, it means the user attempted a GET submission
        // with binary FormData so assign here and skip to handleLoaders.  That
        // way we handle calling loaders above the boundary etc.  It's not really
        // different from an actionError in that sense.
        pendingActionResult = [
            findNearestBoundary(matches).route.id,
            {
                type: ResultType.error,
                error: opts.pendingError
            }
        ];
        else if (opts && opts.submission && isMutationMethod(opts.submission.formMethod)) {
            // Call action if we received an action submission
            let actionResult = await handleAction(request, location, opts.submission, matches, fogOfWar.active, {
                replace: opts.replace,
                flushSync
            });
            if (actionResult.shortCircuited) return;
            // If we received a 404 from handleAction, it's because we couldn't lazily
            // discover the destination route so we don't want to call loaders
            if (actionResult.pendingActionResult) {
                let [routeId, result] = actionResult.pendingActionResult;
                if (isErrorResult(result) && isRouteErrorResponse(result.error) && result.error.status === 404) {
                    pendingNavigationController = null;
                    completeNavigation(location, {
                        matches: actionResult.matches,
                        loaderData: {},
                        errors: {
                            [routeId]: result.error
                        }
                    });
                    return;
                }
            }
            matches = actionResult.matches || matches;
            pendingActionResult = actionResult.pendingActionResult;
            loadingNavigation = getLoadingNavigation(location, opts.submission);
            flushSync = false;
            // No need to do fog of war matching again on loader execution
            fogOfWar.active = false;
            // Create a GET request for the loaders
            request = createClientSideRequest(init.history, request.url, request.signal);
        }
        // Call loaders
        let { shortCircuited, matches: updatedMatches, loaderData, errors } = await handleLoaders(request, location, matches, fogOfWar.active, loadingNavigation, opts && opts.submission, opts && opts.fetcherSubmission, opts && opts.replace, opts && opts.initialHydration === true, flushSync, pendingActionResult);
        if (shortCircuited) return;
        // Clean up now that the action/loaders have completed.  Don't clean up if
        // we short circuited because pendingNavigationController will have already
        // been assigned to a new controller for the next navigation
        pendingNavigationController = null;
        completeNavigation(location, _extends({
            matches: updatedMatches || matches
        }, getActionDataForCommit(pendingActionResult), {
            loaderData,
            errors
        }));
    }
    // Call the action matched by the leaf route for this navigation and handle
    // redirects/errors
    async function handleAction(request, location, submission, matches, isFogOfWar, opts) {
        if (opts === void 0) opts = {};
        interruptActiveLoads();
        // Put us in a submitting state
        let navigation = getSubmittingNavigation(location, submission);
        updateState({
            navigation
        }, {
            flushSync: opts.flushSync === true
        });
        if (isFogOfWar) {
            let discoverResult = await discoverRoutes(matches, location.pathname, request.signal);
            if (discoverResult.type === "aborted") return {
                shortCircuited: true
            };
            else if (discoverResult.type === "error") {
                let { boundaryId, error } = handleDiscoverRouteError(location.pathname, discoverResult);
                return {
                    matches: discoverResult.partialMatches,
                    pendingActionResult: [
                        boundaryId,
                        {
                            type: ResultType.error,
                            error
                        }
                    ]
                };
            } else if (!discoverResult.matches) {
                let { notFoundMatches, error, route } = handleNavigational404(location.pathname);
                return {
                    matches: notFoundMatches,
                    pendingActionResult: [
                        route.id,
                        {
                            type: ResultType.error,
                            error
                        }
                    ]
                };
            } else matches = discoverResult.matches;
        }
        // Call our action and get the result
        let result;
        let actionMatch = getTargetMatch(matches, location);
        if (!actionMatch.route.action && !actionMatch.route.lazy) result = {
            type: ResultType.error,
            error: getInternalRouterError(405, {
                method: request.method,
                pathname: location.pathname,
                routeId: actionMatch.route.id
            })
        };
        else {
            let results = await callDataStrategy("action", state, request, [
                actionMatch
            ], matches, null);
            result = results[actionMatch.route.id];
            if (request.signal.aborted) return {
                shortCircuited: true
            };
        }
        if (isRedirectResult(result)) {
            let replace;
            if (opts && opts.replace != null) replace = opts.replace;
            else {
                // If the user didn't explicity indicate replace behavior, replace if
                // we redirected to the exact same location we're currently at to avoid
                // double back-buttons
                let location = normalizeRedirectLocation(result.response.headers.get("Location"), new URL(request.url), basename);
                replace = location === state.location.pathname + state.location.search;
            }
            await startRedirectNavigation(request, result, true, {
                submission,
                replace
            });
            return {
                shortCircuited: true
            };
        }
        if (isDeferredResult(result)) throw getInternalRouterError(400, {
            type: "defer-action"
        });
        if (isErrorResult(result)) {
            // Store off the pending error - we use it to determine which loaders
            // to call and will commit it when we complete the navigation
            let boundaryMatch = findNearestBoundary(matches, actionMatch.route.id);
            // By default, all submissions to the current location are REPLACE
            // navigations, but if the action threw an error that'll be rendered in
            // an errorElement, we fall back to PUSH so that the user can use the
            // back button to get back to the pre-submission form location to try
            // again
            if ((opts && opts.replace) !== true) pendingAction = Action.Push;
            return {
                matches,
                pendingActionResult: [
                    boundaryMatch.route.id,
                    result
                ]
            };
        }
        return {
            matches,
            pendingActionResult: [
                actionMatch.route.id,
                result
            ]
        };
    }
    // Call all applicable loaders for the given matches, handling redirects,
    // errors, etc.
    async function handleLoaders(request, location, matches, isFogOfWar, overrideNavigation, submission, fetcherSubmission, replace, initialHydration, flushSync, pendingActionResult) {
        // Figure out the right navigation we want to use for data loading
        let loadingNavigation = overrideNavigation || getLoadingNavigation(location, submission);
        // If this was a redirect from an action we don't have a "submission" but
        // we have it on the loading navigation so use that if available
        let activeSubmission = submission || fetcherSubmission || getSubmissionFromNavigation(loadingNavigation);
        // If this is an uninterrupted revalidation, we remain in our current idle
        // state.  If not, we need to switch to our loading state and load data,
        // preserving any new action data or existing action data (in the case of
        // a revalidation interrupting an actionReload)
        // If we have partialHydration enabled, then don't update the state for the
        // initial data load since it's not a "navigation"
        let shouldUpdateNavigationState = !isUninterruptedRevalidation && (!future.v7_partialHydration || !initialHydration);
        // When fog of war is enabled, we enter our `loading` state earlier so we
        // can discover new routes during the `loading` state.  We skip this if
        // we've already run actions since we would have done our matching already.
        // If the children() function threw then, we want to proceed with the
        // partial matches it discovered.
        if (isFogOfWar) {
            if (shouldUpdateNavigationState) {
                let actionData = getUpdatedActionData(pendingActionResult);
                updateState(_extends({
                    navigation: loadingNavigation
                }, actionData !== undefined ? {
                    actionData
                } : {}), {
                    flushSync
                });
            }
            let discoverResult = await discoverRoutes(matches, location.pathname, request.signal);
            if (discoverResult.type === "aborted") return {
                shortCircuited: true
            };
            else if (discoverResult.type === "error") {
                let { boundaryId, error } = handleDiscoverRouteError(location.pathname, discoverResult);
                return {
                    matches: discoverResult.partialMatches,
                    loaderData: {},
                    errors: {
                        [boundaryId]: error
                    }
                };
            } else if (!discoverResult.matches) {
                let { error, notFoundMatches, route } = handleNavigational404(location.pathname);
                return {
                    matches: notFoundMatches,
                    loaderData: {},
                    errors: {
                        [route.id]: error
                    }
                };
            } else matches = discoverResult.matches;
        }
        let routesToUse = inFlightDataRoutes || dataRoutes;
        let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(init.history, state, matches, activeSubmission, location, future.v7_partialHydration && initialHydration === true, future.v7_skipActionErrorRevalidation, isRevalidationRequired, cancelledDeferredRoutes, cancelledFetcherLoads, deletedFetchers, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, pendingActionResult);
        // Cancel pending deferreds for no-longer-matched routes or routes we're
        // about to reload.  Note that if this is an action reload we would have
        // already cancelled all pending deferreds so this would be a no-op
        cancelActiveDeferreds((routeId)=>!(matches && matches.some((m)=>m.route.id === routeId)) || matchesToLoad && matchesToLoad.some((m)=>m.route.id === routeId));
        pendingNavigationLoadId = ++incrementingLoadId;
        // Short circuit if we have no loaders to run
        if (matchesToLoad.length === 0 && revalidatingFetchers.length === 0) {
            let updatedFetchers = markFetchRedirectsDone();
            completeNavigation(location, _extends({
                matches,
                loaderData: {},
                // Commit pending error if we're short circuiting
                errors: pendingActionResult && isErrorResult(pendingActionResult[1]) ? {
                    [pendingActionResult[0]]: pendingActionResult[1].error
                } : null
            }, getActionDataForCommit(pendingActionResult), updatedFetchers ? {
                fetchers: new Map(state.fetchers)
            } : {}), {
                flushSync
            });
            return {
                shortCircuited: true
            };
        }
        if (shouldUpdateNavigationState) {
            let updates = {};
            if (!isFogOfWar) {
                // Only update navigation/actionNData if we didn't already do it above
                updates.navigation = loadingNavigation;
                let actionData = getUpdatedActionData(pendingActionResult);
                if (actionData !== undefined) updates.actionData = actionData;
            }
            if (revalidatingFetchers.length > 0) updates.fetchers = getUpdatedRevalidatingFetchers(revalidatingFetchers);
            updateState(updates, {
                flushSync
            });
        }
        revalidatingFetchers.forEach((rf)=>{
            if (fetchControllers.has(rf.key)) abortFetcher(rf.key);
            if (rf.controller) // Fetchers use an independent AbortController so that aborting a fetcher
            // (via deleteFetcher) does not abort the triggering navigation that
            // triggered the revalidation
            fetchControllers.set(rf.key, rf.controller);
        });
        // Proxy navigation abort through to revalidation fetchers
        let abortPendingFetchRevalidations = ()=>revalidatingFetchers.forEach((f)=>abortFetcher(f.key));
        if (pendingNavigationController) pendingNavigationController.signal.addEventListener("abort", abortPendingFetchRevalidations);
        let { loaderResults, fetcherResults } = await callLoadersAndMaybeResolveData(state, matches, matchesToLoad, revalidatingFetchers, request);
        if (request.signal.aborted) return {
            shortCircuited: true
        };
        // Clean up _after_ loaders have completed.  Don't clean up if we short
        // circuited because fetchControllers would have been aborted and
        // reassigned to new controllers for the next navigation
        if (pendingNavigationController) pendingNavigationController.signal.removeEventListener("abort", abortPendingFetchRevalidations);
        revalidatingFetchers.forEach((rf)=>fetchControllers.delete(rf.key));
        // If any loaders returned a redirect Response, start a new REPLACE navigation
        let redirect = findRedirect(loaderResults);
        if (redirect) {
            await startRedirectNavigation(request, redirect.result, true, {
                replace
            });
            return {
                shortCircuited: true
            };
        }
        redirect = findRedirect(fetcherResults);
        if (redirect) {
            // If this redirect came from a fetcher make sure we mark it in
            // fetchRedirectIds so it doesn't get revalidated on the next set of
            // loader executions
            fetchRedirectIds.add(redirect.key);
            await startRedirectNavigation(request, redirect.result, true, {
                replace
            });
            return {
                shortCircuited: true
            };
        }
        // Process and commit output from loaders
        let { loaderData, errors } = processLoaderData(state, matches, matchesToLoad, loaderResults, pendingActionResult, revalidatingFetchers, fetcherResults, activeDeferreds);
        // Wire up subscribers to update loaderData as promises settle
        activeDeferreds.forEach((deferredData, routeId)=>{
            deferredData.subscribe((aborted)=>{
                // Note: No need to updateState here since the TrackedPromise on
                // loaderData is stable across resolve/reject
                // Remove this instance if we were aborted or if promises have settled
                if (aborted || deferredData.done) activeDeferreds.delete(routeId);
            });
        });
        // During partial hydration, preserve SSR errors for routes that don't re-run
        if (future.v7_partialHydration && initialHydration && state.errors) Object.entries(state.errors).filter((_ref2)=>{
            let [id] = _ref2;
            return !matchesToLoad.some((m)=>m.route.id === id);
        }).forEach((_ref3)=>{
            let [routeId, error] = _ref3;
            errors = Object.assign(errors || {}, {
                [routeId]: error
            });
        });
        let updatedFetchers = markFetchRedirectsDone();
        let didAbortFetchLoads = abortStaleFetchLoads(pendingNavigationLoadId);
        let shouldUpdateFetchers = updatedFetchers || didAbortFetchLoads || revalidatingFetchers.length > 0;
        return _extends({
            matches,
            loaderData,
            errors
        }, shouldUpdateFetchers ? {
            fetchers: new Map(state.fetchers)
        } : {});
    }
    function getUpdatedActionData(pendingActionResult) {
        if (pendingActionResult && !isErrorResult(pendingActionResult[1])) // This is cast to `any` currently because `RouteData`uses any and it
        // would be a breaking change to use any.
        // TODO: v7 - change `RouteData` to use `unknown` instead of `any`
        return {
            [pendingActionResult[0]]: pendingActionResult[1].data
        };
        else if (state.actionData) {
            if (Object.keys(state.actionData).length === 0) return null;
            else return state.actionData;
        }
    }
    function getUpdatedRevalidatingFetchers(revalidatingFetchers) {
        revalidatingFetchers.forEach((rf)=>{
            let fetcher = state.fetchers.get(rf.key);
            let revalidatingFetcher = getLoadingFetcher(undefined, fetcher ? fetcher.data : undefined);
            state.fetchers.set(rf.key, revalidatingFetcher);
        });
        return new Map(state.fetchers);
    }
    // Trigger a fetcher load/submit for the given fetcher key
    function fetch(key, routeId, href, opts) {
        if (isServer) throw new Error("router.fetch() was called during the server render, but it shouldn't be. You are likely calling a useFetcher() method in the body of your component. Try moving it to a useEffect or a callback.");
        if (fetchControllers.has(key)) abortFetcher(key);
        let flushSync = (opts && opts.unstable_flushSync) === true;
        let routesToUse = inFlightDataRoutes || dataRoutes;
        let normalizedPath = normalizeTo(state.location, state.matches, basename, future.v7_prependBasename, href, future.v7_relativeSplatPath, routeId, opts == null ? void 0 : opts.relative);
        let matches = matchRoutes(routesToUse, normalizedPath, basename);
        let fogOfWar = checkFogOfWar(matches, routesToUse, normalizedPath);
        if (fogOfWar.active && fogOfWar.matches) matches = fogOfWar.matches;
        if (!matches) {
            setFetcherError(key, routeId, getInternalRouterError(404, {
                pathname: normalizedPath
            }), {
                flushSync
            });
            return;
        }
        let { path, submission, error } = normalizeNavigateOptions(future.v7_normalizeFormMethod, true, normalizedPath, opts);
        if (error) {
            setFetcherError(key, routeId, error, {
                flushSync
            });
            return;
        }
        let match = getTargetMatch(matches, path);
        pendingPreventScrollReset = (opts && opts.preventScrollReset) === true;
        if (submission && isMutationMethod(submission.formMethod)) {
            handleFetcherAction(key, routeId, path, match, matches, fogOfWar.active, flushSync, submission);
            return;
        }
        // Store off the match so we can call it's shouldRevalidate on subsequent
        // revalidations
        fetchLoadMatches.set(key, {
            routeId,
            path
        });
        handleFetcherLoader(key, routeId, path, match, matches, fogOfWar.active, flushSync, submission);
    }
    // Call the action for the matched fetcher.submit(), and then handle redirects,
    // errors, and revalidation
    async function handleFetcherAction(key, routeId, path, match, requestMatches, isFogOfWar, flushSync, submission) {
        interruptActiveLoads();
        fetchLoadMatches.delete(key);
        function detectAndHandle405Error(m) {
            if (!m.route.action && !m.route.lazy) {
                let error = getInternalRouterError(405, {
                    method: submission.formMethod,
                    pathname: path,
                    routeId: routeId
                });
                setFetcherError(key, routeId, error, {
                    flushSync
                });
                return true;
            }
            return false;
        }
        if (!isFogOfWar && detectAndHandle405Error(match)) return;
        // Put this fetcher into it's submitting state
        let existingFetcher = state.fetchers.get(key);
        updateFetcherState(key, getSubmittingFetcher(submission, existingFetcher), {
            flushSync
        });
        let abortController = new AbortController();
        let fetchRequest = createClientSideRequest(init.history, path, abortController.signal, submission);
        if (isFogOfWar) {
            let discoverResult = await discoverRoutes(requestMatches, path, fetchRequest.signal);
            if (discoverResult.type === "aborted") return;
            else if (discoverResult.type === "error") {
                let { error } = handleDiscoverRouteError(path, discoverResult);
                setFetcherError(key, routeId, error, {
                    flushSync
                });
                return;
            } else if (!discoverResult.matches) {
                setFetcherError(key, routeId, getInternalRouterError(404, {
                    pathname: path
                }), {
                    flushSync
                });
                return;
            } else {
                requestMatches = discoverResult.matches;
                match = getTargetMatch(requestMatches, path);
                if (detectAndHandle405Error(match)) return;
            }
        }
        // Call the action for the fetcher
        fetchControllers.set(key, abortController);
        let originatingLoadId = incrementingLoadId;
        let actionResults = await callDataStrategy("action", state, fetchRequest, [
            match
        ], requestMatches, key);
        let actionResult = actionResults[match.route.id];
        if (fetchRequest.signal.aborted) {
            // We can delete this so long as we weren't aborted by our own fetcher
            // re-submit which would have put _new_ controller is in fetchControllers
            if (fetchControllers.get(key) === abortController) fetchControllers.delete(key);
            return;
        }
        // When using v7_fetcherPersist, we don't want errors bubbling up to the UI
        // or redirects processed for unmounted fetchers so we just revert them to
        // idle
        if (future.v7_fetcherPersist && deletedFetchers.has(key)) {
            if (isRedirectResult(actionResult) || isErrorResult(actionResult)) {
                updateFetcherState(key, getDoneFetcher(undefined));
                return;
            }
        } else {
            if (isRedirectResult(actionResult)) {
                fetchControllers.delete(key);
                if (pendingNavigationLoadId > originatingLoadId) {
                    // A new navigation was kicked off after our action started, so that
                    // should take precedence over this redirect navigation.  We already
                    // set isRevalidationRequired so all loaders for the new route should
                    // fire unless opted out via shouldRevalidate
                    updateFetcherState(key, getDoneFetcher(undefined));
                    return;
                } else {
                    fetchRedirectIds.add(key);
                    updateFetcherState(key, getLoadingFetcher(submission));
                    return startRedirectNavigation(fetchRequest, actionResult, false, {
                        fetcherSubmission: submission
                    });
                }
            }
            // Process any non-redirect errors thrown
            if (isErrorResult(actionResult)) {
                setFetcherError(key, routeId, actionResult.error);
                return;
            }
        }
        if (isDeferredResult(actionResult)) throw getInternalRouterError(400, {
            type: "defer-action"
        });
        // Start the data load for current matches, or the next location if we're
        // in the middle of a navigation
        let nextLocation = state.navigation.location || state.location;
        let revalidationRequest = createClientSideRequest(init.history, nextLocation, abortController.signal);
        let routesToUse = inFlightDataRoutes || dataRoutes;
        let matches = state.navigation.state !== "idle" ? matchRoutes(routesToUse, state.navigation.location, basename) : state.matches;
        invariant(matches, "Didn't find any matches after fetcher action");
        let loadId = ++incrementingLoadId;
        fetchReloadIds.set(key, loadId);
        let loadFetcher = getLoadingFetcher(submission, actionResult.data);
        state.fetchers.set(key, loadFetcher);
        let [matchesToLoad, revalidatingFetchers] = getMatchesToLoad(init.history, state, matches, submission, nextLocation, false, future.v7_skipActionErrorRevalidation, isRevalidationRequired, cancelledDeferredRoutes, cancelledFetcherLoads, deletedFetchers, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, [
            match.route.id,
            actionResult
        ]);
        // Put all revalidating fetchers into the loading state, except for the
        // current fetcher which we want to keep in it's current loading state which
        // contains it's action submission info + action data
        revalidatingFetchers.filter((rf)=>rf.key !== key).forEach((rf)=>{
            let staleKey = rf.key;
            let existingFetcher = state.fetchers.get(staleKey);
            let revalidatingFetcher = getLoadingFetcher(undefined, existingFetcher ? existingFetcher.data : undefined);
            state.fetchers.set(staleKey, revalidatingFetcher);
            if (fetchControllers.has(staleKey)) abortFetcher(staleKey);
            if (rf.controller) fetchControllers.set(staleKey, rf.controller);
        });
        updateState({
            fetchers: new Map(state.fetchers)
        });
        let abortPendingFetchRevalidations = ()=>revalidatingFetchers.forEach((rf)=>abortFetcher(rf.key));
        abortController.signal.addEventListener("abort", abortPendingFetchRevalidations);
        let { loaderResults, fetcherResults } = await callLoadersAndMaybeResolveData(state, matches, matchesToLoad, revalidatingFetchers, revalidationRequest);
        if (abortController.signal.aborted) return;
        abortController.signal.removeEventListener("abort", abortPendingFetchRevalidations);
        fetchReloadIds.delete(key);
        fetchControllers.delete(key);
        revalidatingFetchers.forEach((r)=>fetchControllers.delete(r.key));
        let redirect = findRedirect(loaderResults);
        if (redirect) return startRedirectNavigation(revalidationRequest, redirect.result, false);
        redirect = findRedirect(fetcherResults);
        if (redirect) {
            // If this redirect came from a fetcher make sure we mark it in
            // fetchRedirectIds so it doesn't get revalidated on the next set of
            // loader executions
            fetchRedirectIds.add(redirect.key);
            return startRedirectNavigation(revalidationRequest, redirect.result, false);
        }
        // Process and commit output from loaders
        let { loaderData, errors } = processLoaderData(state, matches, matchesToLoad, loaderResults, undefined, revalidatingFetchers, fetcherResults, activeDeferreds);
        // Since we let revalidations complete even if the submitting fetcher was
        // deleted, only put it back to idle if it hasn't been deleted
        if (state.fetchers.has(key)) {
            let doneFetcher = getDoneFetcher(actionResult.data);
            state.fetchers.set(key, doneFetcher);
        }
        abortStaleFetchLoads(loadId);
        // If we are currently in a navigation loading state and this fetcher is
        // more recent than the navigation, we want the newer data so abort the
        // navigation and complete it with the fetcher data
        if (state.navigation.state === "loading" && loadId > pendingNavigationLoadId) {
            invariant(pendingAction, "Expected pending action");
            pendingNavigationController && pendingNavigationController.abort();
            completeNavigation(state.navigation.location, {
                matches,
                loaderData,
                errors,
                fetchers: new Map(state.fetchers)
            });
        } else {
            // otherwise just update with the fetcher data, preserving any existing
            // loaderData for loaders that did not need to reload.  We have to
            // manually merge here since we aren't going through completeNavigation
            updateState({
                errors,
                loaderData: mergeLoaderData(state.loaderData, loaderData, matches, errors),
                fetchers: new Map(state.fetchers)
            });
            isRevalidationRequired = false;
        }
    }
    // Call the matched loader for fetcher.load(), handling redirects, errors, etc.
    async function handleFetcherLoader(key, routeId, path, match, matches, isFogOfWar, flushSync, submission) {
        let existingFetcher = state.fetchers.get(key);
        updateFetcherState(key, getLoadingFetcher(submission, existingFetcher ? existingFetcher.data : undefined), {
            flushSync
        });
        let abortController = new AbortController();
        let fetchRequest = createClientSideRequest(init.history, path, abortController.signal);
        if (isFogOfWar) {
            let discoverResult = await discoverRoutes(matches, path, fetchRequest.signal);
            if (discoverResult.type === "aborted") return;
            else if (discoverResult.type === "error") {
                let { error } = handleDiscoverRouteError(path, discoverResult);
                setFetcherError(key, routeId, error, {
                    flushSync
                });
                return;
            } else if (!discoverResult.matches) {
                setFetcherError(key, routeId, getInternalRouterError(404, {
                    pathname: path
                }), {
                    flushSync
                });
                return;
            } else {
                matches = discoverResult.matches;
                match = getTargetMatch(matches, path);
            }
        }
        // Call the loader for this fetcher route match
        fetchControllers.set(key, abortController);
        let originatingLoadId = incrementingLoadId;
        let results = await callDataStrategy("loader", state, fetchRequest, [
            match
        ], matches, key);
        let result = results[match.route.id];
        // Deferred isn't supported for fetcher loads, await everything and treat it
        // as a normal load.  resolveDeferredData will return undefined if this
        // fetcher gets aborted, so we just leave result untouched and short circuit
        // below if that happens
        if (isDeferredResult(result)) result = await resolveDeferredData(result, fetchRequest.signal, true) || result;
        // We can delete this so long as we weren't aborted by our our own fetcher
        // re-load which would have put _new_ controller is in fetchControllers
        if (fetchControllers.get(key) === abortController) fetchControllers.delete(key);
        if (fetchRequest.signal.aborted) return;
        // We don't want errors bubbling up or redirects followed for unmounted
        // fetchers, so short circuit here if it was removed from the UI
        if (deletedFetchers.has(key)) {
            updateFetcherState(key, getDoneFetcher(undefined));
            return;
        }
        // If the loader threw a redirect Response, start a new REPLACE navigation
        if (isRedirectResult(result)) {
            if (pendingNavigationLoadId > originatingLoadId) {
                // A new navigation was kicked off after our loader started, so that
                // should take precedence over this redirect navigation
                updateFetcherState(key, getDoneFetcher(undefined));
                return;
            } else {
                fetchRedirectIds.add(key);
                await startRedirectNavigation(fetchRequest, result, false);
                return;
            }
        }
        // Process any non-redirect errors thrown
        if (isErrorResult(result)) {
            setFetcherError(key, routeId, result.error);
            return;
        }
        invariant(!isDeferredResult(result), "Unhandled fetcher deferred data");
        // Put the fetcher back into an idle state
        updateFetcherState(key, getDoneFetcher(result.data));
    }
    /**
   * Utility function to handle redirects returned from an action or loader.
   * Normally, a redirect "replaces" the navigation that triggered it.  So, for
   * example:
   *
   *  - user is on /a
   *  - user clicks a link to /b
   *  - loader for /b redirects to /c
   *
   * In a non-JS app the browser would track the in-flight navigation to /b and
   * then replace it with /c when it encountered the redirect response.  In
   * the end it would only ever update the URL bar with /c.
   *
   * In client-side routing using pushState/replaceState, we aim to emulate
   * this behavior and we also do not update history until the end of the
   * navigation (including processed redirects).  This means that we never
   * actually touch history until we've processed redirects, so we just use
   * the history action from the original navigation (PUSH or REPLACE).
   */ async function startRedirectNavigation(request, redirect, isNavigation, _temp2) {
        let { submission, fetcherSubmission, replace } = _temp2 === void 0 ? {} : _temp2;
        if (redirect.response.headers.has("X-Remix-Revalidate")) isRevalidationRequired = true;
        let location = redirect.response.headers.get("Location");
        invariant(location, "Expected a Location header on the redirect Response");
        location = normalizeRedirectLocation(location, new URL(request.url), basename);
        let redirectLocation = createLocation(state.location, location, {
            _isRedirect: true
        });
        if (isBrowser) {
            let isDocumentReload = false;
            if (redirect.response.headers.has("X-Remix-Reload-Document")) // Hard reload if the response contained X-Remix-Reload-Document
            isDocumentReload = true;
            else if (ABSOLUTE_URL_REGEX.test(location)) {
                const url = init.history.createURL(location);
                isDocumentReload = // Hard reload if it's an absolute URL to a new origin
                url.origin !== routerWindow.location.origin || // Hard reload if it's an absolute URL that does not match our basename
                stripBasename(url.pathname, basename) == null;
            }
            if (isDocumentReload) {
                if (replace) routerWindow.location.replace(location);
                else routerWindow.location.assign(location);
                return;
            }
        }
        // There's no need to abort on redirects, since we don't detect the
        // redirect until the action/loaders have settled
        pendingNavigationController = null;
        let redirectHistoryAction = replace === true || redirect.response.headers.has("X-Remix-Replace") ? Action.Replace : Action.Push;
        // Use the incoming submission if provided, fallback on the active one in
        // state.navigation
        let { formMethod, formAction, formEncType } = state.navigation;
        if (!submission && !fetcherSubmission && formMethod && formAction && formEncType) submission = getSubmissionFromNavigation(state.navigation);
        // If this was a 307/308 submission we want to preserve the HTTP method and
        // re-submit the GET/POST/PUT/PATCH/DELETE as a submission navigation to the
        // redirected location
        let activeSubmission = submission || fetcherSubmission;
        if (redirectPreserveMethodStatusCodes.has(redirect.response.status) && activeSubmission && isMutationMethod(activeSubmission.formMethod)) await startNavigation(redirectHistoryAction, redirectLocation, {
            submission: _extends({}, activeSubmission, {
                formAction: location
            }),
            // Preserve these flags across redirects
            preventScrollReset: pendingPreventScrollReset,
            enableViewTransition: isNavigation ? pendingViewTransitionEnabled : undefined
        });
        else {
            // If we have a navigation submission, we will preserve it through the
            // redirect navigation
            let overrideNavigation = getLoadingNavigation(redirectLocation, submission);
            await startNavigation(redirectHistoryAction, redirectLocation, {
                overrideNavigation,
                // Send fetcher submissions through for shouldRevalidate
                fetcherSubmission,
                // Preserve these flags across redirects
                preventScrollReset: pendingPreventScrollReset,
                enableViewTransition: isNavigation ? pendingViewTransitionEnabled : undefined
            });
        }
    }
    // Utility wrapper for calling dataStrategy client-side without having to
    // pass around the manifest, mapRouteProperties, etc.
    async function callDataStrategy(type, state, request, matchesToLoad, matches, fetcherKey) {
        let results;
        let dataResults = {};
        try {
            results = await callDataStrategyImpl(dataStrategyImpl, type, state, request, matchesToLoad, matches, fetcherKey, manifest, mapRouteProperties);
        } catch (e) {
            // If the outer dataStrategy method throws, just return the error for all
            // matches - and it'll naturally bubble to the root
            matchesToLoad.forEach((m)=>{
                dataResults[m.route.id] = {
                    type: ResultType.error,
                    error: e
                };
            });
            return dataResults;
        }
        for (let [routeId, result] of Object.entries(results))if (isRedirectDataStrategyResultResult(result)) {
            let response = result.result;
            dataResults[routeId] = {
                type: ResultType.redirect,
                response: normalizeRelativeRoutingRedirectResponse(response, request, routeId, matches, basename, future.v7_relativeSplatPath)
            };
        } else dataResults[routeId] = await convertDataStrategyResultToDataResult(result);
        return dataResults;
    }
    async function callLoadersAndMaybeResolveData(state, matches, matchesToLoad, fetchersToLoad, request) {
        let currentMatches = state.matches;
        // Kick off loaders and fetchers in parallel
        let loaderResultsPromise = callDataStrategy("loader", state, request, matchesToLoad, matches, null);
        let fetcherResultsPromise = Promise.all(fetchersToLoad.map(async (f)=>{
            if (f.matches && f.match && f.controller) {
                let results = await callDataStrategy("loader", state, createClientSideRequest(init.history, f.path, f.controller.signal), [
                    f.match
                ], f.matches, f.key);
                let result = results[f.match.route.id];
                // Fetcher results are keyed by fetcher key from here on out, not routeId
                return {
                    [f.key]: result
                };
            } else return Promise.resolve({
                [f.key]: {
                    type: ResultType.error,
                    error: getInternalRouterError(404, {
                        pathname: f.path
                    })
                }
            });
        }));
        let loaderResults = await loaderResultsPromise;
        let fetcherResults = (await fetcherResultsPromise).reduce((acc, r)=>Object.assign(acc, r), {});
        await Promise.all([
            resolveNavigationDeferredResults(matches, loaderResults, request.signal, currentMatches, state.loaderData),
            resolveFetcherDeferredResults(matches, fetcherResults, fetchersToLoad)
        ]);
        return {
            loaderResults,
            fetcherResults
        };
    }
    function interruptActiveLoads() {
        // Every interruption triggers a revalidation
        isRevalidationRequired = true;
        // Cancel pending route-level deferreds and mark cancelled routes for
        // revalidation
        cancelledDeferredRoutes.push(...cancelActiveDeferreds());
        // Abort in-flight fetcher loads
        fetchLoadMatches.forEach((_, key)=>{
            if (fetchControllers.has(key)) {
                cancelledFetcherLoads.add(key);
                abortFetcher(key);
            }
        });
    }
    function updateFetcherState(key, fetcher, opts) {
        if (opts === void 0) opts = {};
        state.fetchers.set(key, fetcher);
        updateState({
            fetchers: new Map(state.fetchers)
        }, {
            flushSync: (opts && opts.flushSync) === true
        });
    }
    function setFetcherError(key, routeId, error, opts) {
        if (opts === void 0) opts = {};
        let boundaryMatch = findNearestBoundary(state.matches, routeId);
        deleteFetcher(key);
        updateState({
            errors: {
                [boundaryMatch.route.id]: error
            },
            fetchers: new Map(state.fetchers)
        }, {
            flushSync: (opts && opts.flushSync) === true
        });
    }
    function getFetcher(key) {
        if (future.v7_fetcherPersist) {
            activeFetchers.set(key, (activeFetchers.get(key) || 0) + 1);
            // If this fetcher was previously marked for deletion, unmark it since we
            // have a new instance
            if (deletedFetchers.has(key)) deletedFetchers.delete(key);
        }
        return state.fetchers.get(key) || IDLE_FETCHER;
    }
    function deleteFetcher(key) {
        let fetcher = state.fetchers.get(key);
        // Don't abort the controller if this is a deletion of a fetcher.submit()
        // in it's loading phase since - we don't want to abort the corresponding
        // revalidation and want them to complete and land
        if (fetchControllers.has(key) && !(fetcher && fetcher.state === "loading" && fetchReloadIds.has(key))) abortFetcher(key);
        fetchLoadMatches.delete(key);
        fetchReloadIds.delete(key);
        fetchRedirectIds.delete(key);
        deletedFetchers.delete(key);
        cancelledFetcherLoads.delete(key);
        state.fetchers.delete(key);
    }
    function deleteFetcherAndUpdateState(key) {
        if (future.v7_fetcherPersist) {
            let count = (activeFetchers.get(key) || 0) - 1;
            if (count <= 0) {
                activeFetchers.delete(key);
                deletedFetchers.add(key);
            } else activeFetchers.set(key, count);
        } else deleteFetcher(key);
        updateState({
            fetchers: new Map(state.fetchers)
        });
    }
    function abortFetcher(key) {
        let controller = fetchControllers.get(key);
        invariant(controller, "Expected fetch controller: " + key);
        controller.abort();
        fetchControllers.delete(key);
    }
    function markFetchersDone(keys) {
        for (let key of keys){
            let fetcher = getFetcher(key);
            let doneFetcher = getDoneFetcher(fetcher.data);
            state.fetchers.set(key, doneFetcher);
        }
    }
    function markFetchRedirectsDone() {
        let doneKeys = [];
        let updatedFetchers = false;
        for (let key of fetchRedirectIds){
            let fetcher = state.fetchers.get(key);
            invariant(fetcher, "Expected fetcher: " + key);
            if (fetcher.state === "loading") {
                fetchRedirectIds.delete(key);
                doneKeys.push(key);
                updatedFetchers = true;
            }
        }
        markFetchersDone(doneKeys);
        return updatedFetchers;
    }
    function abortStaleFetchLoads(landedId) {
        let yeetedKeys = [];
        for (let [key, id] of fetchReloadIds)if (id < landedId) {
            let fetcher = state.fetchers.get(key);
            invariant(fetcher, "Expected fetcher: " + key);
            if (fetcher.state === "loading") {
                abortFetcher(key);
                fetchReloadIds.delete(key);
                yeetedKeys.push(key);
            }
        }
        markFetchersDone(yeetedKeys);
        return yeetedKeys.length > 0;
    }
    function getBlocker(key, fn) {
        let blocker = state.blockers.get(key) || IDLE_BLOCKER;
        if (blockerFunctions.get(key) !== fn) blockerFunctions.set(key, fn);
        return blocker;
    }
    function deleteBlocker(key) {
        state.blockers.delete(key);
        blockerFunctions.delete(key);
    }
    // Utility function to update blockers, ensuring valid state transitions
    function updateBlocker(key, newBlocker) {
        let blocker = state.blockers.get(key) || IDLE_BLOCKER;
        // Poor mans state machine :)
        // https://mermaid.live/edit#pako:eNqVkc9OwzAMxl8l8nnjAYrEtDIOHEBIgwvKJTReGy3_lDpIqO27k6awMG0XcrLlnz87nwdonESogKXXBuE79rq75XZO3-yHds0RJVuv70YrPlUrCEe2HfrORS3rubqZfuhtpg5C9wk5tZ4VKcRUq88q9Z8RS0-48cE1iHJkL0ugbHuFLus9L6spZy8nX9MP2CNdomVaposqu3fGayT8T8-jJQwhepo_UtpgBQaDEUom04dZhAN1aJBDlUKJBxE1ceB2Smj0Mln-IBW5AFU2dwUiktt_2Qaq2dBfaKdEup85UV7Yd-dKjlnkabl2Pvr0DTkTreM
        invariant(blocker.state === "unblocked" && newBlocker.state === "blocked" || blocker.state === "blocked" && newBlocker.state === "blocked" || blocker.state === "blocked" && newBlocker.state === "proceeding" || blocker.state === "blocked" && newBlocker.state === "unblocked" || blocker.state === "proceeding" && newBlocker.state === "unblocked", "Invalid blocker state transition: " + blocker.state + " -> " + newBlocker.state);
        let blockers = new Map(state.blockers);
        blockers.set(key, newBlocker);
        updateState({
            blockers
        });
    }
    function shouldBlockNavigation(_ref4) {
        let { currentLocation, nextLocation, historyAction } = _ref4;
        if (blockerFunctions.size === 0) return;
        // We ony support a single active blocker at the moment since we don't have
        // any compelling use cases for multi-blocker yet
        if (blockerFunctions.size > 1) warning(false, "A router only supports one blocker at a time");
        let entries = Array.from(blockerFunctions.entries());
        let [blockerKey, blockerFunction] = entries[entries.length - 1];
        let blocker = state.blockers.get(blockerKey);
        if (blocker && blocker.state === "proceeding") // If the blocker is currently proceeding, we don't need to re-check
        // it and can let this navigation continue
        return;
        // At this point, we know we're unblocked/blocked so we need to check the
        // user-provided blocker function
        if (blockerFunction({
            currentLocation,
            nextLocation,
            historyAction
        })) return blockerKey;
    }
    function handleNavigational404(pathname) {
        let error = getInternalRouterError(404, {
            pathname
        });
        let routesToUse = inFlightDataRoutes || dataRoutes;
        let { matches, route } = getShortCircuitMatches(routesToUse);
        // Cancel all pending deferred on 404s since we don't keep any routes
        cancelActiveDeferreds();
        return {
            notFoundMatches: matches,
            route,
            error
        };
    }
    function handleDiscoverRouteError(pathname, discoverResult) {
        return {
            boundaryId: findNearestBoundary(discoverResult.partialMatches).route.id,
            error: getInternalRouterError(400, {
                type: "route-discovery",
                pathname,
                message: discoverResult.error != null && "message" in discoverResult.error ? discoverResult.error : String(discoverResult.error)
            })
        };
    }
    function cancelActiveDeferreds(predicate) {
        let cancelledRouteIds = [];
        activeDeferreds.forEach((dfd, routeId)=>{
            if (!predicate || predicate(routeId)) {
                // Cancel the deferred - but do not remove from activeDeferreds here -
                // we rely on the subscribers to do that so our tests can assert proper
                // cleanup via _internalActiveDeferreds
                dfd.cancel();
                cancelledRouteIds.push(routeId);
                activeDeferreds.delete(routeId);
            }
        });
        return cancelledRouteIds;
    }
    // Opt in to capturing and reporting scroll positions during navigations,
    // used by the <ScrollRestoration> component
    function enableScrollRestoration(positions, getPosition, getKey) {
        savedScrollPositions = positions;
        getScrollPosition = getPosition;
        getScrollRestorationKey = getKey || null;
        // Perform initial hydration scroll restoration, since we miss the boat on
        // the initial updateState() because we've not yet rendered <ScrollRestoration/>
        // and therefore have no savedScrollPositions available
        if (!initialScrollRestored && state.navigation === IDLE_NAVIGATION) {
            initialScrollRestored = true;
            let y = getSavedScrollPosition(state.location, state.matches);
            if (y != null) updateState({
                restoreScrollPosition: y
            });
        }
        return ()=>{
            savedScrollPositions = null;
            getScrollPosition = null;
            getScrollRestorationKey = null;
        };
    }
    function getScrollKey(location, matches) {
        if (getScrollRestorationKey) {
            let key = getScrollRestorationKey(location, matches.map((m)=>convertRouteMatchToUiMatch(m, state.loaderData)));
            return key || location.key;
        }
        return location.key;
    }
    function saveScrollPosition(location, matches) {
        if (savedScrollPositions && getScrollPosition) {
            let key = getScrollKey(location, matches);
            savedScrollPositions[key] = getScrollPosition();
        }
    }
    function getSavedScrollPosition(location, matches) {
        if (savedScrollPositions) {
            let key = getScrollKey(location, matches);
            let y = savedScrollPositions[key];
            if (typeof y === "number") return y;
        }
        return null;
    }
    function checkFogOfWar(matches, routesToUse, pathname) {
        if (patchRoutesOnNavigationImpl) {
            // Don't bother re-calling patchRouteOnMiss for a path we've already
            // processed.  the last execution would have patched the route tree
            // accordingly so `matches` here are already accurate.
            if (discoveredRoutes.has(pathname)) return {
                active: false,
                matches
            };
            if (!matches) {
                let fogMatches = matchRoutesImpl(routesToUse, pathname, basename, true);
                return {
                    active: true,
                    matches: fogMatches || []
                };
            } else if (Object.keys(matches[0].params).length > 0) {
                // If we matched a dynamic param or a splat, it might only be because
                // we haven't yet discovered other routes that would match with a
                // higher score.  Call patchRoutesOnNavigation just to be sure
                let partialMatches = matchRoutesImpl(routesToUse, pathname, basename, true);
                return {
                    active: true,
                    matches: partialMatches
                };
            }
        }
        return {
            active: false,
            matches: null
        };
    }
    async function discoverRoutes(matches, pathname, signal) {
        let partialMatches = matches;
        while(true){
            let isNonHMR = inFlightDataRoutes == null;
            let routesToUse = inFlightDataRoutes || dataRoutes;
            try {
                await loadLazyRouteChildren(patchRoutesOnNavigationImpl, pathname, partialMatches, routesToUse, manifest, mapRouteProperties, pendingPatchRoutes, signal);
            } catch (e) {
                return {
                    type: "error",
                    error: e,
                    partialMatches
                };
            } finally{
                // If we are not in the middle of an HMR revalidation and we changed the
                // routes, provide a new identity so when we `updateState` at the end of
                // this navigation/fetch `router.routes` will be a new identity and
                // trigger a re-run of memoized `router.routes` dependencies.
                // HMR will already update the identity and reflow when it lands
                // `inFlightDataRoutes` in `completeNavigation`
                if (isNonHMR) dataRoutes = [
                    ...dataRoutes
                ];
            }
            if (signal.aborted) return {
                type: "aborted"
            };
            let newMatches = matchRoutes(routesToUse, pathname, basename);
            if (newMatches) {
                addToFifoQueue(pathname, discoveredRoutes);
                return {
                    type: "success",
                    matches: newMatches
                };
            }
            let newPartialMatches = matchRoutesImpl(routesToUse, pathname, basename, true);
            // Avoid loops if the second pass results in the same partial matches
            if (!newPartialMatches || partialMatches.length === newPartialMatches.length && partialMatches.every((m, i)=>m.route.id === newPartialMatches[i].route.id)) {
                addToFifoQueue(pathname, discoveredRoutes);
                return {
                    type: "success",
                    matches: null
                };
            }
            partialMatches = newPartialMatches;
        }
    }
    function addToFifoQueue(path, queue) {
        if (queue.size >= discoveredRoutesMaxSize) {
            let first = queue.values().next().value;
            queue.delete(first);
        }
        queue.add(path);
    }
    function _internalSetRoutes(newRoutes) {
        manifest = {};
        inFlightDataRoutes = convertRoutesToDataRoutes(newRoutes, mapRouteProperties, undefined, manifest);
    }
    function patchRoutes(routeId, children) {
        let isNonHMR = inFlightDataRoutes == null;
        let routesToUse = inFlightDataRoutes || dataRoutes;
        patchRoutesImpl(routeId, children, routesToUse, manifest, mapRouteProperties);
        // If we are not in the middle of an HMR revalidation and we changed the
        // routes, provide a new identity and trigger a reflow via `updateState`
        // to re-run memoized `router.routes` dependencies.
        // HMR will already update the identity and reflow when it lands
        // `inFlightDataRoutes` in `completeNavigation`
        if (isNonHMR) {
            dataRoutes = [
                ...dataRoutes
            ];
            updateState({});
        }
    }
    router = {
        get basename () {
            return basename;
        },
        get future () {
            return future;
        },
        get state () {
            return state;
        },
        get routes () {
            return dataRoutes;
        },
        get window () {
            return routerWindow;
        },
        initialize,
        subscribe,
        enableScrollRestoration,
        navigate,
        fetch,
        revalidate,
        // Passthrough to history-aware createHref used by useHref so we get proper
        // hash-aware URLs in DOM paths
        createHref: (to)=>init.history.createHref(to),
        encodeLocation: (to)=>init.history.encodeLocation(to),
        getFetcher,
        deleteFetcher: deleteFetcherAndUpdateState,
        dispose,
        getBlocker,
        deleteBlocker,
        patchRoutes,
        _internalFetchControllers: fetchControllers,
        _internalActiveDeferreds: activeDeferreds,
        // TODO: Remove setRoutes, it's temporary to avoid dealing with
        // updating the tree while validating the update algorithm.
        _internalSetRoutes
    };
    return router;
}
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region createStaticHandler
////////////////////////////////////////////////////////////////////////////////
const UNSAFE_DEFERRED_SYMBOL = Symbol("deferred");
function createStaticHandler(routes, opts) {
    invariant(routes.length > 0, "You must provide a non-empty routes array to createStaticHandler");
    let manifest = {};
    let basename = (opts ? opts.basename : null) || "/";
    let mapRouteProperties;
    if (opts != null && opts.mapRouteProperties) mapRouteProperties = opts.mapRouteProperties;
    else if (opts != null && opts.detectErrorBoundary) {
        // If they are still using the deprecated version, wrap it with the new API
        let detectErrorBoundary = opts.detectErrorBoundary;
        mapRouteProperties = (route)=>({
                hasErrorBoundary: detectErrorBoundary(route)
            });
    } else mapRouteProperties = defaultMapRouteProperties;
    // Config driven behavior flags
    let future = _extends({
        v7_relativeSplatPath: false,
        v7_throwAbortReason: false
    }, opts ? opts.future : null);
    let dataRoutes = convertRoutesToDataRoutes(routes, mapRouteProperties, undefined, manifest);
    /**
   * The query() method is intended for document requests, in which we want to
   * call an optional action and potentially multiple loaders for all nested
   * routes.  It returns a StaticHandlerContext object, which is very similar
   * to the router state (location, loaderData, actionData, errors, etc.) and
   * also adds SSR-specific information such as the statusCode and headers
   * from action/loaders Responses.
   *
   * It _should_ never throw and should report all errors through the
   * returned context.errors object, properly associating errors to their error
   * boundary.  Additionally, it tracks _deepestRenderedBoundaryId which can be
   * used to emulate React error boundaries during SSr by performing a second
   * pass only down to the boundaryId.
   *
   * The one exception where we do not return a StaticHandlerContext is when a
   * redirect response is returned or thrown from any action/loader.  We
   * propagate that out and return the raw Response so the HTTP server can
   * return it directly.
   *
   * - `opts.requestContext` is an optional server context that will be passed
   *   to actions/loaders in the `context` parameter
   * - `opts.skipLoaderErrorBubbling` is an optional parameter that will prevent
   *   the bubbling of errors which allows single-fetch-type implementations
   *   where the client will handle the bubbling and we may need to return data
   *   for the handling route
   */ async function query(request, _temp3) {
        let { requestContext, skipLoaderErrorBubbling, unstable_dataStrategy } = _temp3 === void 0 ? {} : _temp3;
        let url = new URL(request.url);
        let method = request.method;
        let location = createLocation("", createPath(url), null, "default");
        let matches = matchRoutes(dataRoutes, location, basename);
        // SSR supports HEAD requests while SPA doesn't
        if (!isValidMethod(method) && method !== "HEAD") {
            let error = getInternalRouterError(405, {
                method
            });
            let { matches: methodNotAllowedMatches, route } = getShortCircuitMatches(dataRoutes);
            return {
                basename,
                location,
                matches: methodNotAllowedMatches,
                loaderData: {},
                actionData: null,
                errors: {
                    [route.id]: error
                },
                statusCode: error.status,
                loaderHeaders: {},
                actionHeaders: {},
                activeDeferreds: null
            };
        } else if (!matches) {
            let error = getInternalRouterError(404, {
                pathname: location.pathname
            });
            let { matches: notFoundMatches, route } = getShortCircuitMatches(dataRoutes);
            return {
                basename,
                location,
                matches: notFoundMatches,
                loaderData: {},
                actionData: null,
                errors: {
                    [route.id]: error
                },
                statusCode: error.status,
                loaderHeaders: {},
                actionHeaders: {},
                activeDeferreds: null
            };
        }
        let result = await queryImpl(request, location, matches, requestContext, unstable_dataStrategy || null, skipLoaderErrorBubbling === true, null);
        if (isResponse(result)) return result;
        // When returning StaticHandlerContext, we patch back in the location here
        // since we need it for React Context.  But this helps keep our submit and
        // loadRouteData operating on a Request instead of a Location
        return _extends({
            location,
            basename
        }, result);
    }
    /**
   * The queryRoute() method is intended for targeted route requests, either
   * for fetch ?_data requests or resource route requests.  In this case, we
   * are only ever calling a single action or loader, and we are returning the
   * returned value directly.  In most cases, this will be a Response returned
   * from the action/loader, but it may be a primitive or other value as well -
   * and in such cases the calling context should handle that accordingly.
   *
   * We do respect the throw/return differentiation, so if an action/loader
   * throws, then this method will throw the value.  This is important so we
   * can do proper boundary identification in Remix where a thrown Response
   * must go to the Catch Boundary but a returned Response is happy-path.
   *
   * One thing to note is that any Router-initiated Errors that make sense
   * to associate with a status code will be thrown as an ErrorResponse
   * instance which include the raw Error, such that the calling context can
   * serialize the error as they see fit while including the proper response
   * code.  Examples here are 404 and 405 errors that occur prior to reaching
   * any user-defined loaders.
   *
   * - `opts.routeId` allows you to specify the specific route handler to call.
   *   If not provided the handler will determine the proper route by matching
   *   against `request.url`
   * - `opts.requestContext` is an optional server context that will be passed
   *    to actions/loaders in the `context` parameter
   */ async function queryRoute(request, _temp4) {
        let { routeId, requestContext, unstable_dataStrategy } = _temp4 === void 0 ? {} : _temp4;
        let url = new URL(request.url);
        let method = request.method;
        let location = createLocation("", createPath(url), null, "default");
        let matches = matchRoutes(dataRoutes, location, basename);
        // SSR supports HEAD requests while SPA doesn't
        if (!isValidMethod(method) && method !== "HEAD" && method !== "OPTIONS") throw getInternalRouterError(405, {
            method
        });
        else if (!matches) throw getInternalRouterError(404, {
            pathname: location.pathname
        });
        let match = routeId ? matches.find((m)=>m.route.id === routeId) : getTargetMatch(matches, location);
        if (routeId && !match) throw getInternalRouterError(403, {
            pathname: location.pathname,
            routeId
        });
        else if (!match) // This should never hit I don't think?
        throw getInternalRouterError(404, {
            pathname: location.pathname
        });
        let result = await queryImpl(request, location, matches, requestContext, unstable_dataStrategy || null, false, match);
        if (isResponse(result)) return result;
        let error = result.errors ? Object.values(result.errors)[0] : undefined;
        if (error !== undefined) // If we got back result.errors, that means the loader/action threw
        // _something_ that wasn't a Response, but it's not guaranteed/required
        // to be an `instanceof Error` either, so we have to use throw here to
        // preserve the "error" state outside of queryImpl.
        throw error;
        // Pick off the right state value to return
        if (result.actionData) return Object.values(result.actionData)[0];
        if (result.loaderData) {
            var _result$activeDeferre;
            let data = Object.values(result.loaderData)[0];
            if ((_result$activeDeferre = result.activeDeferreds) != null && _result$activeDeferre[match.route.id]) data[UNSAFE_DEFERRED_SYMBOL] = result.activeDeferreds[match.route.id];
            return data;
        }
        return undefined;
    }
    async function queryImpl(request, location, matches, requestContext, unstable_dataStrategy, skipLoaderErrorBubbling, routeMatch) {
        invariant(request.signal, "query()/queryRoute() requests must contain an AbortController signal");
        try {
            if (isMutationMethod(request.method.toLowerCase())) {
                let result = await submit(request, matches, routeMatch || getTargetMatch(matches, location), requestContext, unstable_dataStrategy, skipLoaderErrorBubbling, routeMatch != null);
                return result;
            }
            let result = await loadRouteData(request, matches, requestContext, unstable_dataStrategy, skipLoaderErrorBubbling, routeMatch);
            return isResponse(result) ? result : _extends({}, result, {
                actionData: null,
                actionHeaders: {}
            });
        } catch (e) {
            // If the user threw/returned a Response in callLoaderOrAction for a
            // `queryRoute` call, we throw the `DataStrategyResult` to bail out early
            // and then return or throw the raw Response here accordingly
            if (isDataStrategyResult(e) && isResponse(e.result)) {
                if (e.type === ResultType.error) throw e.result;
                return e.result;
            }
            // Redirects are always returned since they don't propagate to catch
            // boundaries
            if (isRedirectResponse(e)) return e;
            throw e;
        }
    }
    async function submit(request, matches, actionMatch, requestContext, unstable_dataStrategy, skipLoaderErrorBubbling, isRouteRequest) {
        let result;
        if (!actionMatch.route.action && !actionMatch.route.lazy) {
            let error = getInternalRouterError(405, {
                method: request.method,
                pathname: new URL(request.url).pathname,
                routeId: actionMatch.route.id
            });
            if (isRouteRequest) throw error;
            result = {
                type: ResultType.error,
                error
            };
        } else {
            let results = await callDataStrategy("action", request, [
                actionMatch
            ], matches, isRouteRequest, requestContext, unstable_dataStrategy);
            result = results[actionMatch.route.id];
            if (request.signal.aborted) throwStaticHandlerAbortedError(request, isRouteRequest, future);
        }
        if (isRedirectResult(result)) // Uhhhh - this should never happen, we should always throw these from
        // callLoaderOrAction, but the type narrowing here keeps TS happy and we
        // can get back on the "throw all redirect responses" train here should
        // this ever happen :/
        throw new Response(null, {
            status: result.response.status,
            headers: {
                Location: result.response.headers.get("Location")
            }
        });
        if (isDeferredResult(result)) {
            let error = getInternalRouterError(400, {
                type: "defer-action"
            });
            if (isRouteRequest) throw error;
            result = {
                type: ResultType.error,
                error
            };
        }
        if (isRouteRequest) {
            // Note: This should only be non-Response values if we get here, since
            // isRouteRequest should throw any Response received in callLoaderOrAction
            if (isErrorResult(result)) throw result.error;
            return {
                matches: [
                    actionMatch
                ],
                loaderData: {},
                actionData: {
                    [actionMatch.route.id]: result.data
                },
                errors: null,
                // Note: statusCode + headers are unused here since queryRoute will
                // return the raw Response or value
                statusCode: 200,
                loaderHeaders: {},
                actionHeaders: {},
                activeDeferreds: null
            };
        }
        // Create a GET request for the loaders
        let loaderRequest = new Request(request.url, {
            headers: request.headers,
            redirect: request.redirect,
            signal: request.signal
        });
        if (isErrorResult(result)) {
            // Store off the pending error - we use it to determine which loaders
            // to call and will commit it when we complete the navigation
            let boundaryMatch = skipLoaderErrorBubbling ? actionMatch : findNearestBoundary(matches, actionMatch.route.id);
            let context = await loadRouteData(loaderRequest, matches, requestContext, unstable_dataStrategy, skipLoaderErrorBubbling, null, [
                boundaryMatch.route.id,
                result
            ]);
            // action status codes take precedence over loader status codes
            return _extends({}, context, {
                statusCode: isRouteErrorResponse(result.error) ? result.error.status : result.statusCode != null ? result.statusCode : 500,
                actionData: null,
                actionHeaders: _extends({}, result.headers ? {
                    [actionMatch.route.id]: result.headers
                } : {})
            });
        }
        let context = await loadRouteData(loaderRequest, matches, requestContext, unstable_dataStrategy, skipLoaderErrorBubbling, null);
        return _extends({}, context, {
            actionData: {
                [actionMatch.route.id]: result.data
            }
        }, result.statusCode ? {
            statusCode: result.statusCode
        } : {}, {
            actionHeaders: result.headers ? {
                [actionMatch.route.id]: result.headers
            } : {}
        });
    }
    async function loadRouteData(request, matches, requestContext, unstable_dataStrategy, skipLoaderErrorBubbling, routeMatch, pendingActionResult) {
        let isRouteRequest = routeMatch != null;
        // Short circuit if we have no loaders to run (queryRoute())
        if (isRouteRequest && !(routeMatch != null && routeMatch.route.loader) && !(routeMatch != null && routeMatch.route.lazy)) throw getInternalRouterError(400, {
            method: request.method,
            pathname: new URL(request.url).pathname,
            routeId: routeMatch == null ? void 0 : routeMatch.route.id
        });
        let requestMatches = routeMatch ? [
            routeMatch
        ] : pendingActionResult && isErrorResult(pendingActionResult[1]) ? getLoaderMatchesUntilBoundary(matches, pendingActionResult[0]) : matches;
        let matchesToLoad = requestMatches.filter((m)=>m.route.loader || m.route.lazy);
        // Short circuit if we have no loaders to run (query())
        if (matchesToLoad.length === 0) return {
            matches,
            // Add a null for all matched routes for proper revalidation on the client
            loaderData: matches.reduce((acc, m)=>Object.assign(acc, {
                    [m.route.id]: null
                }), {}),
            errors: pendingActionResult && isErrorResult(pendingActionResult[1]) ? {
                [pendingActionResult[0]]: pendingActionResult[1].error
            } : null,
            statusCode: 200,
            loaderHeaders: {},
            activeDeferreds: null
        };
        let results = await callDataStrategy("loader", request, matchesToLoad, matches, isRouteRequest, requestContext, unstable_dataStrategy);
        if (request.signal.aborted) throwStaticHandlerAbortedError(request, isRouteRequest, future);
        // Process and commit output from loaders
        let activeDeferreds = new Map();
        let context = processRouteLoaderData(matches, results, pendingActionResult, activeDeferreds, skipLoaderErrorBubbling);
        // Add a null for any non-loader matches for proper revalidation on the client
        let executedLoaders = new Set(matchesToLoad.map((match)=>match.route.id));
        matches.forEach((match)=>{
            if (!executedLoaders.has(match.route.id)) context.loaderData[match.route.id] = null;
        });
        return _extends({}, context, {
            matches,
            activeDeferreds: activeDeferreds.size > 0 ? Object.fromEntries(activeDeferreds.entries()) : null
        });
    }
    // Utility wrapper for calling dataStrategy server-side without having to
    // pass around the manifest, mapRouteProperties, etc.
    async function callDataStrategy(type, request, matchesToLoad, matches, isRouteRequest, requestContext, unstable_dataStrategy) {
        let results = await callDataStrategyImpl(unstable_dataStrategy || defaultDataStrategy, type, null, request, matchesToLoad, matches, null, manifest, mapRouteProperties, requestContext);
        let dataResults = {};
        await Promise.all(matches.map(async (match)=>{
            if (!(match.route.id in results)) return;
            let result = results[match.route.id];
            if (isRedirectDataStrategyResultResult(result)) {
                let response = result.result;
                // Throw redirects and let the server handle them with an HTTP redirect
                throw normalizeRelativeRoutingRedirectResponse(response, request, match.route.id, matches, basename, future.v7_relativeSplatPath);
            }
            if (isResponse(result.result) && isRouteRequest) // For SSR single-route requests, we want to hand Responses back
            // directly without unwrapping
            throw result;
            dataResults[match.route.id] = await convertDataStrategyResultToDataResult(result);
        }));
        return dataResults;
    }
    return {
        dataRoutes,
        query,
        queryRoute
    };
}
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region Helpers
////////////////////////////////////////////////////////////////////////////////
/**
 * Given an existing StaticHandlerContext and an error thrown at render time,
 * provide an updated StaticHandlerContext suitable for a second SSR render
 */ function getStaticContextFromError(routes, context, error) {
    let newContext = _extends({}, context, {
        statusCode: isRouteErrorResponse(error) ? error.status : 500,
        errors: {
            [context._deepestRenderedBoundaryId || routes[0].id]: error
        }
    });
    return newContext;
}
function throwStaticHandlerAbortedError(request, isRouteRequest, future) {
    if (future.v7_throwAbortReason && request.signal.reason !== undefined) throw request.signal.reason;
    let method = isRouteRequest ? "queryRoute" : "query";
    throw new Error(method + "() call aborted: " + request.method + " " + request.url);
}
function isSubmissionNavigation(opts) {
    return opts != null && ("formData" in opts && opts.formData != null || "body" in opts && opts.body !== undefined);
}
function normalizeTo(location, matches, basename, prependBasename, to, v7_relativeSplatPath, fromRouteId, relative) {
    let contextualMatches;
    let activeRouteMatch;
    if (fromRouteId) {
        // Grab matches up to the calling route so our route-relative logic is
        // relative to the correct source route
        contextualMatches = [];
        for (let match of matches){
            contextualMatches.push(match);
            if (match.route.id === fromRouteId) {
                activeRouteMatch = match;
                break;
            }
        }
    } else {
        contextualMatches = matches;
        activeRouteMatch = matches[matches.length - 1];
    }
    // Resolve the relative path
    let path = resolveTo(to ? to : ".", getResolveToMatches(contextualMatches, v7_relativeSplatPath), stripBasename(location.pathname, basename) || location.pathname, relative === "path");
    // When `to` is not specified we inherit search/hash from the current
    // location, unlike when to="." and we just inherit the path.
    // See https://github.com/remix-run/remix/issues/927
    if (to == null) {
        path.search = location.search;
        path.hash = location.hash;
    }
    // Add an ?index param for matched index routes if we don't already have one
    if ((to == null || to === "" || to === ".") && activeRouteMatch && activeRouteMatch.route.index && !hasNakedIndexQuery(path.search)) path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
    // If we're operating within a basename, prepend it to the pathname.  If
    // this is a root navigation, then just use the raw basename which allows
    // the basename to have full control over the presence of a trailing slash
    // on root actions
    if (prependBasename && basename !== "/") path.pathname = path.pathname === "/" ? basename : joinPaths([
        basename,
        path.pathname
    ]);
    return createPath(path);
}
// Normalize navigation options by converting formMethod=GET formData objects to
// URLSearchParams so they behave identically to links with query params
function normalizeNavigateOptions(normalizeFormMethod, isFetcher, path, opts) {
    // Return location verbatim on non-submission navigations
    if (!opts || !isSubmissionNavigation(opts)) return {
        path
    };
    if (opts.formMethod && !isValidMethod(opts.formMethod)) return {
        path,
        error: getInternalRouterError(405, {
            method: opts.formMethod
        })
    };
    let getInvalidBodyError = ()=>({
            path,
            error: getInternalRouterError(400, {
                type: "invalid-body"
            })
        });
    // Create a Submission on non-GET navigations
    let rawFormMethod = opts.formMethod || "get";
    let formMethod = normalizeFormMethod ? rawFormMethod.toUpperCase() : rawFormMethod.toLowerCase();
    let formAction = stripHashFromPath(path);
    if (opts.body !== undefined) {
        if (opts.formEncType === "text/plain") {
            // text only support POST/PUT/PATCH/DELETE submissions
            if (!isMutationMethod(formMethod)) return getInvalidBodyError();
            let text = typeof opts.body === "string" ? opts.body : opts.body instanceof FormData || opts.body instanceof URLSearchParams ? // https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#plain-text-form-data
            Array.from(opts.body.entries()).reduce((acc, _ref5)=>{
                let [name, value] = _ref5;
                return "" + acc + name + "=" + value + "\n";
            }, "") : String(opts.body);
            return {
                path,
                submission: {
                    formMethod,
                    formAction,
                    formEncType: opts.formEncType,
                    formData: undefined,
                    json: undefined,
                    text
                }
            };
        } else if (opts.formEncType === "application/json") {
            // json only supports POST/PUT/PATCH/DELETE submissions
            if (!isMutationMethod(formMethod)) return getInvalidBodyError();
            try {
                let json = typeof opts.body === "string" ? JSON.parse(opts.body) : opts.body;
                return {
                    path,
                    submission: {
                        formMethod,
                        formAction,
                        formEncType: opts.formEncType,
                        formData: undefined,
                        json,
                        text: undefined
                    }
                };
            } catch (e) {
                return getInvalidBodyError();
            }
        }
    }
    invariant(typeof FormData === "function", "FormData is not available in this environment");
    let searchParams;
    let formData;
    if (opts.formData) {
        searchParams = convertFormDataToSearchParams(opts.formData);
        formData = opts.formData;
    } else if (opts.body instanceof FormData) {
        searchParams = convertFormDataToSearchParams(opts.body);
        formData = opts.body;
    } else if (opts.body instanceof URLSearchParams) {
        searchParams = opts.body;
        formData = convertSearchParamsToFormData(searchParams);
    } else if (opts.body == null) {
        searchParams = new URLSearchParams();
        formData = new FormData();
    } else try {
        searchParams = new URLSearchParams(opts.body);
        formData = convertSearchParamsToFormData(searchParams);
    } catch (e) {
        return getInvalidBodyError();
    }
    let submission = {
        formMethod,
        formAction,
        formEncType: opts && opts.formEncType || "application/x-www-form-urlencoded",
        formData,
        json: undefined,
        text: undefined
    };
    if (isMutationMethod(submission.formMethod)) return {
        path,
        submission
    };
    // Flatten submission onto URLSearchParams for GET submissions
    let parsedPath = parsePath(path);
    // On GET navigation submissions we can drop the ?index param from the
    // resulting location since all loaders will run.  But fetcher GET submissions
    // only run a single loader so we need to preserve any incoming ?index params
    if (isFetcher && parsedPath.search && hasNakedIndexQuery(parsedPath.search)) searchParams.append("index", "");
    parsedPath.search = "?" + searchParams;
    return {
        path: createPath(parsedPath),
        submission
    };
}
// Filter out all routes below any caught error as they aren't going to
// render so we don't need to load them
function getLoaderMatchesUntilBoundary(matches, boundaryId) {
    let boundaryMatches = matches;
    if (boundaryId) {
        let index = matches.findIndex((m)=>m.route.id === boundaryId);
        if (index >= 0) boundaryMatches = matches.slice(0, index);
    }
    return boundaryMatches;
}
function getMatchesToLoad(history, state, matches, submission, location, isInitialLoad, skipActionErrorRevalidation, isRevalidationRequired, cancelledDeferredRoutes, cancelledFetcherLoads, deletedFetchers, fetchLoadMatches, fetchRedirectIds, routesToUse, basename, pendingActionResult) {
    let actionResult = pendingActionResult ? isErrorResult(pendingActionResult[1]) ? pendingActionResult[1].error : pendingActionResult[1].data : undefined;
    let currentUrl = history.createURL(state.location);
    let nextUrl = history.createURL(location);
    // Pick navigation matches that are net-new or qualify for revalidation
    let boundaryId = pendingActionResult && isErrorResult(pendingActionResult[1]) ? pendingActionResult[0] : undefined;
    let boundaryMatches = boundaryId ? getLoaderMatchesUntilBoundary(matches, boundaryId) : matches;
    // Don't revalidate loaders by default after action 4xx/5xx responses
    // when the flag is enabled.  They can still opt-into revalidation via
    // `shouldRevalidate` via `actionResult`
    let actionStatus = pendingActionResult ? pendingActionResult[1].statusCode : undefined;
    let shouldSkipRevalidation = skipActionErrorRevalidation && actionStatus && actionStatus >= 400;
    let navigationMatches = boundaryMatches.filter((match, index)=>{
        let { route } = match;
        if (route.lazy) // We haven't loaded this route yet so we don't know if it's got a loader!
        return true;
        if (route.loader == null) return false;
        if (isInitialLoad) {
            if (typeof route.loader !== "function" || route.loader.hydrate) return true;
            return state.loaderData[route.id] === undefined && (// Don't re-run if the loader ran and threw an error
            !state.errors || state.errors[route.id] === undefined);
        }
        // Always call the loader on new route instances and pending defer cancellations
        if (isNewLoader(state.loaderData, state.matches[index], match) || cancelledDeferredRoutes.some((id)=>id === match.route.id)) return true;
        // This is the default implementation for when we revalidate.  If the route
        // provides it's own implementation, then we give them full control but
        // provide this value so they can leverage it if needed after they check
        // their own specific use cases
        let currentRouteMatch = state.matches[index];
        let nextRouteMatch = match;
        return shouldRevalidateLoader(match, _extends({
            currentUrl,
            currentParams: currentRouteMatch.params,
            nextUrl,
            nextParams: nextRouteMatch.params
        }, submission, {
            actionResult,
            actionStatus,
            defaultShouldRevalidate: shouldSkipRevalidation ? false : // Forced revalidation due to submission, useRevalidator, or X-Remix-Revalidate
            isRevalidationRequired || currentUrl.pathname + currentUrl.search === nextUrl.pathname + nextUrl.search || // Search params affect all loaders
            currentUrl.search !== nextUrl.search || isNewRouteInstance(currentRouteMatch, nextRouteMatch)
        }));
    });
    // Pick fetcher.loads that need to be revalidated
    let revalidatingFetchers = [];
    fetchLoadMatches.forEach((f, key)=>{
        // Don't revalidate:
        //  - on initial load (shouldn't be any fetchers then anyway)
        //  - if fetcher won't be present in the subsequent render
        //    - no longer matches the URL (v7_fetcherPersist=false)
        //    - was unmounted but persisted due to v7_fetcherPersist=true
        if (isInitialLoad || !matches.some((m)=>m.route.id === f.routeId) || deletedFetchers.has(key)) return;
        let fetcherMatches = matchRoutes(routesToUse, f.path, basename);
        // If the fetcher path no longer matches, push it in with null matches so
        // we can trigger a 404 in callLoadersAndMaybeResolveData.  Note this is
        // currently only a use-case for Remix HMR where the route tree can change
        // at runtime and remove a route previously loaded via a fetcher
        if (!fetcherMatches) {
            revalidatingFetchers.push({
                key,
                routeId: f.routeId,
                path: f.path,
                matches: null,
                match: null,
                controller: null
            });
            return;
        }
        // Revalidating fetchers are decoupled from the route matches since they
        // load from a static href.  They revalidate based on explicit revalidation
        // (submission, useRevalidator, or X-Remix-Revalidate)
        let fetcher = state.fetchers.get(key);
        let fetcherMatch = getTargetMatch(fetcherMatches, f.path);
        let shouldRevalidate = false;
        if (fetchRedirectIds.has(key)) // Never trigger a revalidation of an actively redirecting fetcher
        shouldRevalidate = false;
        else if (cancelledFetcherLoads.has(key)) {
            // Always mark for revalidation if the fetcher was cancelled
            cancelledFetcherLoads.delete(key);
            shouldRevalidate = true;
        } else if (fetcher && fetcher.state !== "idle" && fetcher.data === undefined) // If the fetcher hasn't ever completed loading yet, then this isn't a
        // revalidation, it would just be a brand new load if an explicit
        // revalidation is required
        shouldRevalidate = isRevalidationRequired;
        else // Otherwise fall back on any user-defined shouldRevalidate, defaulting
        // to explicit revalidations only
        shouldRevalidate = shouldRevalidateLoader(fetcherMatch, _extends({
            currentUrl,
            currentParams: state.matches[state.matches.length - 1].params,
            nextUrl,
            nextParams: matches[matches.length - 1].params
        }, submission, {
            actionResult,
            actionStatus,
            defaultShouldRevalidate: shouldSkipRevalidation ? false : isRevalidationRequired
        }));
        if (shouldRevalidate) revalidatingFetchers.push({
            key,
            routeId: f.routeId,
            path: f.path,
            matches: fetcherMatches,
            match: fetcherMatch,
            controller: new AbortController()
        });
    });
    return [
        navigationMatches,
        revalidatingFetchers
    ];
}
function isNewLoader(currentLoaderData, currentMatch, match) {
    let isNew = // [a] -> [a, b]
    !currentMatch || // [a, b] -> [a, c]
    match.route.id !== currentMatch.route.id;
    // Handle the case that we don't have data for a re-used route, potentially
    // from a prior error or from a cancelled pending deferred
    let isMissingData = currentLoaderData[match.route.id] === undefined;
    // Always load if this is a net-new route or we don't yet have data
    return isNew || isMissingData;
}
function isNewRouteInstance(currentMatch, match) {
    let currentPath = currentMatch.route.path;
    return(// param change for this match, /users/123 -> /users/456
    currentMatch.pathname !== match.pathname || // splat param changed, which is not present in match.path
    // e.g. /files/images/avatar.jpg -> files/finances.xls
    currentPath != null && currentPath.endsWith("*") && currentMatch.params["*"] !== match.params["*"]);
}
function shouldRevalidateLoader(loaderMatch, arg) {
    if (loaderMatch.route.shouldRevalidate) {
        let routeChoice = loaderMatch.route.shouldRevalidate(arg);
        if (typeof routeChoice === "boolean") return routeChoice;
    }
    return arg.defaultShouldRevalidate;
}
/**
 * Idempotent utility to execute patchRoutesOnNavigation() to lazily load route
 * definitions and update the routes/routeManifest
 */ async function loadLazyRouteChildren(patchRoutesOnNavigationImpl, path, matches, routes, manifest, mapRouteProperties, pendingRouteChildren, signal) {
    let key = [
        path,
        ...matches.map((m)=>m.route.id)
    ].join("-");
    try {
        let pending = pendingRouteChildren.get(key);
        if (!pending) {
            pending = patchRoutesOnNavigationImpl({
                path,
                matches,
                patch: (routeId, children)=>{
                    if (!signal.aborted) patchRoutesImpl(routeId, children, routes, manifest, mapRouteProperties);
                }
            });
            pendingRouteChildren.set(key, pending);
        }
        if (pending && isPromise(pending)) await pending;
    } finally{
        pendingRouteChildren.delete(key);
    }
}
function patchRoutesImpl(routeId, children, routesToUse, manifest, mapRouteProperties) {
    if (routeId) {
        var _route$children;
        let route = manifest[routeId];
        invariant(route, "No route found to patch children into: routeId = " + routeId);
        let dataChildren = convertRoutesToDataRoutes(children, mapRouteProperties, [
            routeId,
            "patch",
            String(((_route$children = route.children) == null ? void 0 : _route$children.length) || "0")
        ], manifest);
        if (route.children) route.children.push(...dataChildren);
        else route.children = dataChildren;
    } else {
        let dataChildren = convertRoutesToDataRoutes(children, mapRouteProperties, [
            "patch",
            String(routesToUse.length || "0")
        ], manifest);
        routesToUse.push(...dataChildren);
    }
}
/**
 * Execute route.lazy() methods to lazily load route modules (loader, action,
 * shouldRevalidate) and update the routeManifest in place which shares objects
 * with dataRoutes so those get updated as well.
 */ async function loadLazyRouteModule(route, mapRouteProperties, manifest) {
    if (!route.lazy) return;
    let lazyRoute = await route.lazy();
    // If the lazy route function was executed and removed by another parallel
    // call then we can return - first lazy() to finish wins because the return
    // value of lazy is expected to be static
    if (!route.lazy) return;
    let routeToUpdate = manifest[route.id];
    invariant(routeToUpdate, "No route found in manifest");
    // Update the route in place.  This should be safe because there's no way
    // we could yet be sitting on this route as we can't get there without
    // resolving lazy() first.
    //
    // This is different than the HMR "update" use-case where we may actively be
    // on the route being updated.  The main concern boils down to "does this
    // mutation affect any ongoing navigations or any current state.matches
    // values?".  If not, it should be safe to update in place.
    let routeUpdates = {};
    for(let lazyRouteProperty in lazyRoute){
        let staticRouteValue = routeToUpdate[lazyRouteProperty];
        let isPropertyStaticallyDefined = staticRouteValue !== undefined && // This property isn't static since it should always be updated based
        // on the route updates
        lazyRouteProperty !== "hasErrorBoundary";
        warning(!isPropertyStaticallyDefined, "Route \"" + routeToUpdate.id + "\" has a static property \"" + lazyRouteProperty + "\" " + "defined but its lazy function is also returning a value for this property. " + ("The lazy route property \"" + lazyRouteProperty + "\" will be ignored."));
        if (!isPropertyStaticallyDefined && !immutableRouteKeys.has(lazyRouteProperty)) routeUpdates[lazyRouteProperty] = lazyRoute[lazyRouteProperty];
    }
    // Mutate the route with the provided updates.  Do this first so we pass
    // the updated version to mapRouteProperties
    Object.assign(routeToUpdate, routeUpdates);
    // Mutate the `hasErrorBoundary` property on the route based on the route
    // updates and remove the `lazy` function so we don't resolve the lazy
    // route again.
    Object.assign(routeToUpdate, _extends({}, mapRouteProperties(routeToUpdate), {
        lazy: undefined
    }));
}
// Default implementation of `dataStrategy` which fetches all loaders in parallel
async function defaultDataStrategy(_ref6) {
    let { matches } = _ref6;
    let matchesToLoad = matches.filter((m)=>m.shouldLoad);
    let results = await Promise.all(matchesToLoad.map((m)=>m.resolve()));
    return results.reduce((acc, result, i)=>Object.assign(acc, {
            [matchesToLoad[i].route.id]: result
        }), {});
}
async function callDataStrategyImpl(dataStrategyImpl, type, state, request, matchesToLoad, matches, fetcherKey, manifest, mapRouteProperties, requestContext) {
    let loadRouteDefinitionsPromises = matches.map((m)=>m.route.lazy ? loadLazyRouteModule(m.route, mapRouteProperties, manifest) : undefined);
    let dsMatches = matches.map((match, i)=>{
        let loadRoutePromise = loadRouteDefinitionsPromises[i];
        let shouldLoad = matchesToLoad.some((m)=>m.route.id === match.route.id);
        // `resolve` encapsulates route.lazy(), executing the loader/action,
        // and mapping return values/thrown errors to a `DataStrategyResult`.  Users
        // can pass a callback to take fine-grained control over the execution
        // of the loader/action
        let resolve = async (handlerOverride)=>{
            if (handlerOverride && request.method === "GET" && (match.route.lazy || match.route.loader)) shouldLoad = true;
            return shouldLoad ? callLoaderOrAction(type, request, match, loadRoutePromise, handlerOverride, requestContext) : Promise.resolve({
                type: ResultType.data,
                result: undefined
            });
        };
        return _extends({}, match, {
            shouldLoad,
            resolve
        });
    });
    // Send all matches here to allow for a middleware-type implementation.
    // handler will be a no-op for unneeded routes and we filter those results
    // back out below.
    let results = await dataStrategyImpl({
        matches: dsMatches,
        request,
        params: matches[0].params,
        fetcherKey,
        context: requestContext
    });
    // Wait for all routes to load here but 'swallow the error since we want
    // it to bubble up from the `await loadRoutePromise` in `callLoaderOrAction` -
    // called from `match.resolve()`
    try {
        await Promise.all(loadRouteDefinitionsPromises);
    } catch (e) {
    // No-op
    }
    return results;
}
// Default logic for calling a loader/action is the user has no specified a dataStrategy
async function callLoaderOrAction(type, request, match, loadRoutePromise, handlerOverride, staticContext) {
    let result;
    let onReject;
    let runHandler = (handler)=>{
        // Setup a promise we can race against so that abort signals short circuit
        let reject;
        // This will never resolve so safe to type it as Promise<DataStrategyResult> to
        // satisfy the function return value
        let abortPromise = new Promise((_, r)=>reject = r);
        onReject = ()=>reject();
        request.signal.addEventListener("abort", onReject);
        let actualHandler = (ctx)=>{
            if (typeof handler !== "function") return Promise.reject(new Error("You cannot call the handler for a route which defines a boolean " + ("\"" + type + "\" [routeId: " + match.route.id + "]")));
            return handler({
                request,
                params: match.params,
                context: staticContext
            }, ...ctx !== undefined ? [
                ctx
            ] : []);
        };
        let handlerPromise = (async ()=>{
            try {
                let val = await (handlerOverride ? handlerOverride((ctx)=>actualHandler(ctx)) : actualHandler());
                return {
                    type: "data",
                    result: val
                };
            } catch (e) {
                return {
                    type: "error",
                    result: e
                };
            }
        })();
        return Promise.race([
            handlerPromise,
            abortPromise
        ]);
    };
    try {
        let handler = match.route[type];
        // If we have a route.lazy promise, await that first
        if (loadRoutePromise) {
            if (handler) {
                // Run statically defined handler in parallel with lazy()
                let handlerError;
                let [value] = await Promise.all([
                    // If the handler throws, don't let it immediately bubble out,
                    // since we need to let the lazy() execution finish so we know if this
                    // route has a boundary that can handle the error
                    runHandler(handler).catch((e)=>{
                        handlerError = e;
                    }),
                    loadRoutePromise
                ]);
                if (handlerError !== undefined) throw handlerError;
                result = value;
            } else {
                // Load lazy route module, then run any returned handler
                await loadRoutePromise;
                handler = match.route[type];
                if (handler) // Handler still runs even if we got interrupted to maintain consistency
                // with un-abortable behavior of handler execution on non-lazy or
                // previously-lazy-loaded routes
                result = await runHandler(handler);
                else if (type === "action") {
                    let url = new URL(request.url);
                    let pathname = url.pathname + url.search;
                    throw getInternalRouterError(405, {
                        method: request.method,
                        pathname,
                        routeId: match.route.id
                    });
                } else // lazy() route has no loader to run.  Short circuit here so we don't
                // hit the invariant below that errors on returning undefined.
                return {
                    type: ResultType.data,
                    result: undefined
                };
            }
        } else if (!handler) {
            let url = new URL(request.url);
            let pathname = url.pathname + url.search;
            throw getInternalRouterError(404, {
                pathname
            });
        } else result = await runHandler(handler);
        invariant(result.result !== undefined, "You defined " + (type === "action" ? "an action" : "a loader") + " for route " + ("\"" + match.route.id + "\" but didn't return anything from your `" + type + "` ") + "function. Please return a value or `null`.");
    } catch (e) {
        // We should already be catching and converting normal handler executions to
        // DataStrategyResults and returning them, so anything that throws here is an
        // unexpected error we still need to wrap
        return {
            type: ResultType.error,
            result: e
        };
    } finally{
        if (onReject) request.signal.removeEventListener("abort", onReject);
    }
    return result;
}
async function convertDataStrategyResultToDataResult(dataStrategyResult) {
    let { result, type } = dataStrategyResult;
    if (isResponse(result)) {
        let data;
        try {
            let contentType = result.headers.get("Content-Type");
            // Check between word boundaries instead of startsWith() due to the last
            // paragraph of https://httpwg.org/specs/rfc9110.html#field.content-type
            if (contentType && /\bapplication\/json\b/.test(contentType)) {
                if (result.body == null) data = null;
                else data = await result.json();
            } else data = await result.text();
        } catch (e) {
            return {
                type: ResultType.error,
                error: e
            };
        }
        if (type === ResultType.error) return {
            type: ResultType.error,
            error: new ErrorResponseImpl(result.status, result.statusText, data),
            statusCode: result.status,
            headers: result.headers
        };
        return {
            type: ResultType.data,
            data,
            statusCode: result.status,
            headers: result.headers
        };
    }
    if (type === ResultType.error) {
        if (isDataWithResponseInit(result)) {
            var _result$init2;
            if (result.data instanceof Error) {
                var _result$init;
                return {
                    type: ResultType.error,
                    error: result.data,
                    statusCode: (_result$init = result.init) == null ? void 0 : _result$init.status
                };
            }
            // Convert thrown unstable_data() to ErrorResponse instances
            result = new ErrorResponseImpl(((_result$init2 = result.init) == null ? void 0 : _result$init2.status) || 500, undefined, result.data);
        }
        return {
            type: ResultType.error,
            error: result,
            statusCode: isRouteErrorResponse(result) ? result.status : undefined
        };
    }
    if (isDeferredData(result)) {
        var _result$init3, _result$init4;
        return {
            type: ResultType.deferred,
            deferredData: result,
            statusCode: (_result$init3 = result.init) == null ? void 0 : _result$init3.status,
            headers: ((_result$init4 = result.init) == null ? void 0 : _result$init4.headers) && new Headers(result.init.headers)
        };
    }
    if (isDataWithResponseInit(result)) {
        var _result$init5, _result$init6;
        return {
            type: ResultType.data,
            data: result.data,
            statusCode: (_result$init5 = result.init) == null ? void 0 : _result$init5.status,
            headers: (_result$init6 = result.init) != null && _result$init6.headers ? new Headers(result.init.headers) : undefined
        };
    }
    return {
        type: ResultType.data,
        data: result
    };
}
// Support relative routing in internal redirects
function normalizeRelativeRoutingRedirectResponse(response, request, routeId, matches, basename, v7_relativeSplatPath) {
    let location = response.headers.get("Location");
    invariant(location, "Redirects returned/thrown from loaders/actions must have a Location header");
    if (!ABSOLUTE_URL_REGEX.test(location)) {
        let trimmedMatches = matches.slice(0, matches.findIndex((m)=>m.route.id === routeId) + 1);
        location = normalizeTo(new URL(request.url), trimmedMatches, basename, true, location, v7_relativeSplatPath);
        response.headers.set("Location", location);
    }
    return response;
}
function normalizeRedirectLocation(location, currentUrl, basename) {
    if (ABSOLUTE_URL_REGEX.test(location)) {
        // Strip off the protocol+origin for same-origin + same-basename absolute redirects
        let normalizedLocation = location;
        let url = normalizedLocation.startsWith("//") ? new URL(currentUrl.protocol + normalizedLocation) : new URL(normalizedLocation);
        let isSameBasename = stripBasename(url.pathname, basename) != null;
        if (url.origin === currentUrl.origin && isSameBasename) return url.pathname + url.search + url.hash;
    }
    return location;
}
// Utility method for creating the Request instances for loaders/actions during
// client-side navigations and fetches.  During SSR we will always have a
// Request instance from the static handler (query/queryRoute)
function createClientSideRequest(history, location, signal, submission) {
    let url = history.createURL(stripHashFromPath(location)).toString();
    let init = {
        signal
    };
    if (submission && isMutationMethod(submission.formMethod)) {
        let { formMethod, formEncType } = submission;
        // Didn't think we needed this but it turns out unlike other methods, patch
        // won't be properly normalized to uppercase and results in a 405 error.
        // See: https://fetch.spec.whatwg.org/#concept-method
        init.method = formMethod.toUpperCase();
        if (formEncType === "application/json") {
            init.headers = new Headers({
                "Content-Type": formEncType
            });
            init.body = JSON.stringify(submission.json);
        } else if (formEncType === "text/plain") // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
        init.body = submission.text;
        else if (formEncType === "application/x-www-form-urlencoded" && submission.formData) // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
        init.body = convertFormDataToSearchParams(submission.formData);
        else // Content-Type is inferred (https://fetch.spec.whatwg.org/#dom-request)
        init.body = submission.formData;
    }
    return new Request(url, init);
}
function convertFormDataToSearchParams(formData) {
    let searchParams = new URLSearchParams();
    for (let [key, value] of formData.entries())// https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#converting-an-entry-list-to-a-list-of-name-value-pairs
    searchParams.append(key, typeof value === "string" ? value : value.name);
    return searchParams;
}
function convertSearchParamsToFormData(searchParams) {
    let formData = new FormData();
    for (let [key, value] of searchParams.entries())formData.append(key, value);
    return formData;
}
function processRouteLoaderData(matches, results, pendingActionResult, activeDeferreds, skipLoaderErrorBubbling) {
    // Fill in loaderData/errors from our loaders
    let loaderData = {};
    let errors = null;
    let statusCode;
    let foundError = false;
    let loaderHeaders = {};
    let pendingError = pendingActionResult && isErrorResult(pendingActionResult[1]) ? pendingActionResult[1].error : undefined;
    // Process loader results into state.loaderData/state.errors
    matches.forEach((match)=>{
        if (!(match.route.id in results)) return;
        let id = match.route.id;
        let result = results[id];
        invariant(!isRedirectResult(result), "Cannot handle redirect results in processLoaderData");
        if (isErrorResult(result)) {
            let error = result.error;
            // If we have a pending action error, we report it at the highest-route
            // that throws a loader error, and then clear it out to indicate that
            // it was consumed
            if (pendingError !== undefined) {
                error = pendingError;
                pendingError = undefined;
            }
            errors = errors || {};
            if (skipLoaderErrorBubbling) errors[id] = error;
            else {
                // Look upwards from the matched route for the closest ancestor error
                // boundary, defaulting to the root match.  Prefer higher error values
                // if lower errors bubble to the same boundary
                let boundaryMatch = findNearestBoundary(matches, id);
                if (errors[boundaryMatch.route.id] == null) errors[boundaryMatch.route.id] = error;
            }
            // Clear our any prior loaderData for the throwing route
            loaderData[id] = undefined;
            // Once we find our first (highest) error, we set the status code and
            // prevent deeper status codes from overriding
            if (!foundError) {
                foundError = true;
                statusCode = isRouteErrorResponse(result.error) ? result.error.status : 500;
            }
            if (result.headers) loaderHeaders[id] = result.headers;
        } else if (isDeferredResult(result)) {
            activeDeferreds.set(id, result.deferredData);
            loaderData[id] = result.deferredData.data;
            // Error status codes always override success status codes, but if all
            // loaders are successful we take the deepest status code.
            if (result.statusCode != null && result.statusCode !== 200 && !foundError) statusCode = result.statusCode;
            if (result.headers) loaderHeaders[id] = result.headers;
        } else {
            loaderData[id] = result.data;
            // Error status codes always override success status codes, but if all
            // loaders are successful we take the deepest status code.
            if (result.statusCode && result.statusCode !== 200 && !foundError) statusCode = result.statusCode;
            if (result.headers) loaderHeaders[id] = result.headers;
        }
    });
    // If we didn't consume the pending action error (i.e., all loaders
    // resolved), then consume it here.  Also clear out any loaderData for the
    // throwing route
    if (pendingError !== undefined && pendingActionResult) {
        errors = {
            [pendingActionResult[0]]: pendingError
        };
        loaderData[pendingActionResult[0]] = undefined;
    }
    return {
        loaderData,
        errors,
        statusCode: statusCode || 200,
        loaderHeaders
    };
}
function processLoaderData(state, matches, matchesToLoad, results, pendingActionResult, revalidatingFetchers, fetcherResults, activeDeferreds) {
    let { loaderData, errors } = processRouteLoaderData(matches, results, pendingActionResult, activeDeferreds, false // This method is only called client side so we always want to bubble
    );
    // Process results from our revalidating fetchers
    revalidatingFetchers.forEach((rf)=>{
        let { key, match, controller } = rf;
        let result = fetcherResults[key];
        invariant(result, "Did not find corresponding fetcher result");
        // Process fetcher non-redirect errors
        if (controller && controller.signal.aborted) // Nothing to do for aborted fetchers
        return;
        else if (isErrorResult(result)) {
            let boundaryMatch = findNearestBoundary(state.matches, match == null ? void 0 : match.route.id);
            if (!(errors && errors[boundaryMatch.route.id])) errors = _extends({}, errors, {
                [boundaryMatch.route.id]: result.error
            });
            state.fetchers.delete(key);
        } else if (isRedirectResult(result)) // Should never get here, redirects should get processed above, but we
        // keep this to type narrow to a success result in the else
        invariant(false, "Unhandled fetcher revalidation redirect");
        else if (isDeferredResult(result)) // Should never get here, deferred data should be awaited for fetchers
        // in resolveDeferredResults
        invariant(false, "Unhandled fetcher deferred data");
        else {
            let doneFetcher = getDoneFetcher(result.data);
            state.fetchers.set(key, doneFetcher);
        }
    });
    return {
        loaderData,
        errors
    };
}
function mergeLoaderData(loaderData, newLoaderData, matches, errors) {
    let mergedLoaderData = _extends({}, newLoaderData);
    for (let match of matches){
        let id = match.route.id;
        if (newLoaderData.hasOwnProperty(id)) {
            if (newLoaderData[id] !== undefined) mergedLoaderData[id] = newLoaderData[id];
        } else if (loaderData[id] !== undefined && match.route.loader) // Preserve existing keys not included in newLoaderData and where a loader
        // wasn't removed by HMR
        mergedLoaderData[id] = loaderData[id];
        if (errors && errors.hasOwnProperty(id)) break;
    }
    return mergedLoaderData;
}
function getActionDataForCommit(pendingActionResult) {
    if (!pendingActionResult) return {};
    return isErrorResult(pendingActionResult[1]) ? {
        // Clear out prior actionData on errors
        actionData: {}
    } : {
        actionData: {
            [pendingActionResult[0]]: pendingActionResult[1].data
        }
    };
}
// Find the nearest error boundary, looking upwards from the leaf route (or the
// route specified by routeId) for the closest ancestor error boundary,
// defaulting to the root match
function findNearestBoundary(matches, routeId) {
    let eligibleMatches = routeId ? matches.slice(0, matches.findIndex((m)=>m.route.id === routeId) + 1) : [
        ...matches
    ];
    return eligibleMatches.reverse().find((m)=>m.route.hasErrorBoundary === true) || matches[0];
}
function getShortCircuitMatches(routes) {
    // Prefer a root layout route if present, otherwise shim in a route object
    let route = routes.length === 1 ? routes[0] : routes.find((r)=>r.index || !r.path || r.path === "/") || {
        id: "__shim-error-route__"
    };
    return {
        matches: [
            {
                params: {},
                pathname: "",
                pathnameBase: "",
                route
            }
        ],
        route
    };
}
function getInternalRouterError(status, _temp5) {
    let { pathname, routeId, method, type, message } = _temp5 === void 0 ? {} : _temp5;
    let statusText = "Unknown Server Error";
    let errorMessage = "Unknown @remix-run/router error";
    if (status === 400) {
        statusText = "Bad Request";
        if (type === "route-discovery") errorMessage = "Unable to match URL \"" + pathname + "\" - the `unstable_patchRoutesOnNavigation()` " + ("function threw the following error:\n" + message);
        else if (method && pathname && routeId) errorMessage = "You made a " + method + " request to \"" + pathname + "\" but " + ("did not provide a `loader` for route \"" + routeId + "\", ") + "so there is no way to handle the request.";
        else if (type === "defer-action") errorMessage = "defer() is not supported in actions";
        else if (type === "invalid-body") errorMessage = "Unable to encode submission body";
    } else if (status === 403) {
        statusText = "Forbidden";
        errorMessage = "Route \"" + routeId + "\" does not match URL \"" + pathname + "\"";
    } else if (status === 404) {
        statusText = "Not Found";
        errorMessage = "No route matches URL \"" + pathname + "\"";
    } else if (status === 405) {
        statusText = "Method Not Allowed";
        if (method && pathname && routeId) errorMessage = "You made a " + method.toUpperCase() + " request to \"" + pathname + "\" but " + ("did not provide an `action` for route \"" + routeId + "\", ") + "so there is no way to handle the request.";
        else if (method) errorMessage = "Invalid request method \"" + method.toUpperCase() + "\"";
    }
    return new ErrorResponseImpl(status || 500, statusText, new Error(errorMessage), true);
}
// Find any returned redirect errors, starting from the lowest match
function findRedirect(results) {
    let entries = Object.entries(results);
    for(let i = entries.length - 1; i >= 0; i--){
        let [key, result] = entries[i];
        if (isRedirectResult(result)) return {
            key,
            result
        };
    }
}
function stripHashFromPath(path) {
    let parsedPath = typeof path === "string" ? parsePath(path) : path;
    return createPath(_extends({}, parsedPath, {
        hash: ""
    }));
}
function isHashChangeOnly(a, b) {
    if (a.pathname !== b.pathname || a.search !== b.search) return false;
    if (a.hash === "") // /page -> /page#hash
    return b.hash !== "";
    else if (a.hash === b.hash) // /page#hash -> /page#hash
    return true;
    else if (b.hash !== "") // /page#hash -> /page#other
    return true;
    // If the hash is removed the browser will re-perform a request to the server
    // /page#hash -> /page
    return false;
}
function isPromise(val) {
    return typeof val === "object" && val != null && "then" in val;
}
function isDataStrategyResult(result) {
    return result != null && typeof result === "object" && "type" in result && "result" in result && (result.type === ResultType.data || result.type === ResultType.error);
}
function isRedirectDataStrategyResultResult(result) {
    return isResponse(result.result) && redirectStatusCodes.has(result.result.status);
}
function isDeferredResult(result) {
    return result.type === ResultType.deferred;
}
function isErrorResult(result) {
    return result.type === ResultType.error;
}
function isRedirectResult(result) {
    return (result && result.type) === ResultType.redirect;
}
function isDataWithResponseInit(value) {
    return typeof value === "object" && value != null && "type" in value && "data" in value && "init" in value && value.type === "DataWithResponseInit";
}
function isDeferredData(value) {
    let deferred = value;
    return deferred && typeof deferred === "object" && typeof deferred.data === "object" && typeof deferred.subscribe === "function" && typeof deferred.cancel === "function" && typeof deferred.resolveData === "function";
}
function isResponse(value) {
    return value != null && typeof value.status === "number" && typeof value.statusText === "string" && typeof value.headers === "object" && typeof value.body !== "undefined";
}
function isRedirectResponse(result) {
    if (!isResponse(result)) return false;
    let status = result.status;
    let location = result.headers.get("Location");
    return status >= 300 && status <= 399 && location != null;
}
function isValidMethod(method) {
    return validRequestMethods.has(method.toLowerCase());
}
function isMutationMethod(method) {
    return validMutationMethods.has(method.toLowerCase());
}
async function resolveNavigationDeferredResults(matches, results, signal, currentMatches, currentLoaderData) {
    let entries = Object.entries(results);
    for(let index = 0; index < entries.length; index++){
        let [routeId, result] = entries[index];
        let match = matches.find((m)=>(m == null ? void 0 : m.route.id) === routeId);
        // If we don't have a match, then we can have a deferred result to do
        // anything with.  This is for revalidating fetchers where the route was
        // removed during HMR
        if (!match) continue;
        let currentMatch = currentMatches.find((m)=>m.route.id === match.route.id);
        let isRevalidatingLoader = currentMatch != null && !isNewRouteInstance(currentMatch, match) && (currentLoaderData && currentLoaderData[match.route.id]) !== undefined;
        if (isDeferredResult(result) && isRevalidatingLoader) // Note: we do not have to touch activeDeferreds here since we race them
        // against the signal in resolveDeferredData and they'll get aborted
        // there if needed
        await resolveDeferredData(result, signal, false).then((result)=>{
            if (result) results[routeId] = result;
        });
    }
}
async function resolveFetcherDeferredResults(matches, results, revalidatingFetchers) {
    for(let index = 0; index < revalidatingFetchers.length; index++){
        let { key, routeId, controller } = revalidatingFetchers[index];
        let result = results[key];
        let match = matches.find((m)=>(m == null ? void 0 : m.route.id) === routeId);
        // If we don't have a match, then we can have a deferred result to do
        // anything with.  This is for revalidating fetchers where the route was
        // removed during HMR
        if (!match) continue;
        if (isDeferredResult(result)) {
            // Note: we do not have to touch activeDeferreds here since we race them
            // against the signal in resolveDeferredData and they'll get aborted
            // there if needed
            invariant(controller, "Expected an AbortController for revalidating fetcher deferred result");
            await resolveDeferredData(result, controller.signal, true).then((result)=>{
                if (result) results[key] = result;
            });
        }
    }
}
async function resolveDeferredData(result, signal, unwrap) {
    if (unwrap === void 0) unwrap = false;
    let aborted = await result.deferredData.resolveData(signal);
    if (aborted) return;
    if (unwrap) try {
        return {
            type: ResultType.data,
            data: result.deferredData.unwrappedData
        };
    } catch (e) {
        // Handle any TrackedPromise._error values encountered while unwrapping
        return {
            type: ResultType.error,
            error: e
        };
    }
    return {
        type: ResultType.data,
        data: result.deferredData.data
    };
}
function hasNakedIndexQuery(search) {
    return new URLSearchParams(search).getAll("index").some((v)=>v === "");
}
function getTargetMatch(matches, location) {
    let search = typeof location === "string" ? parsePath(location).search : location.search;
    if (matches[matches.length - 1].route.index && hasNakedIndexQuery(search || "")) // Return the leaf index route when index is present
    return matches[matches.length - 1];
    // Otherwise grab the deepest "path contributing" match (ignoring index and
    // pathless layout routes)
    let pathMatches = getPathContributingMatches(matches);
    return pathMatches[pathMatches.length - 1];
}
function getSubmissionFromNavigation(navigation) {
    let { formMethod, formAction, formEncType, text, formData, json } = navigation;
    if (!formMethod || !formAction || !formEncType) return;
    if (text != null) return {
        formMethod,
        formAction,
        formEncType,
        formData: undefined,
        json: undefined,
        text
    };
    else if (formData != null) return {
        formMethod,
        formAction,
        formEncType,
        formData,
        json: undefined,
        text: undefined
    };
    else if (json !== undefined) return {
        formMethod,
        formAction,
        formEncType,
        formData: undefined,
        json,
        text: undefined
    };
}
function getLoadingNavigation(location, submission) {
    if (submission) {
        let navigation = {
            state: "loading",
            location,
            formMethod: submission.formMethod,
            formAction: submission.formAction,
            formEncType: submission.formEncType,
            formData: submission.formData,
            json: submission.json,
            text: submission.text
        };
        return navigation;
    } else {
        let navigation = {
            state: "loading",
            location,
            formMethod: undefined,
            formAction: undefined,
            formEncType: undefined,
            formData: undefined,
            json: undefined,
            text: undefined
        };
        return navigation;
    }
}
function getSubmittingNavigation(location, submission) {
    let navigation = {
        state: "submitting",
        location,
        formMethod: submission.formMethod,
        formAction: submission.formAction,
        formEncType: submission.formEncType,
        formData: submission.formData,
        json: submission.json,
        text: submission.text
    };
    return navigation;
}
function getLoadingFetcher(submission, data) {
    if (submission) {
        let fetcher = {
            state: "loading",
            formMethod: submission.formMethod,
            formAction: submission.formAction,
            formEncType: submission.formEncType,
            formData: submission.formData,
            json: submission.json,
            text: submission.text,
            data
        };
        return fetcher;
    } else {
        let fetcher = {
            state: "loading",
            formMethod: undefined,
            formAction: undefined,
            formEncType: undefined,
            formData: undefined,
            json: undefined,
            text: undefined,
            data
        };
        return fetcher;
    }
}
function getSubmittingFetcher(submission, existingFetcher) {
    let fetcher = {
        state: "submitting",
        formMethod: submission.formMethod,
        formAction: submission.formAction,
        formEncType: submission.formEncType,
        formData: submission.formData,
        json: submission.json,
        text: submission.text,
        data: existingFetcher ? existingFetcher.data : undefined
    };
    return fetcher;
}
function getDoneFetcher(data) {
    let fetcher = {
        state: "idle",
        formMethod: undefined,
        formAction: undefined,
        formEncType: undefined,
        formData: undefined,
        json: undefined,
        text: undefined,
        data
    };
    return fetcher;
}
function restoreAppliedTransitions(_window, transitions) {
    try {
        let sessionPositions = _window.sessionStorage.getItem(TRANSITIONS_STORAGE_KEY);
        if (sessionPositions) {
            let json = JSON.parse(sessionPositions);
            for (let [k, v] of Object.entries(json || {}))if (v && Array.isArray(v)) transitions.set(k, new Set(v || []));
        }
    } catch (e) {
    // no-op, use default empty object
    }
}
function persistAppliedTransitions(_window, transitions) {
    if (transitions.size > 0) {
        let json = {};
        for (let [k, v] of transitions)json[k] = [
            ...v
        ];
        try {
            _window.sessionStorage.setItem(TRANSITIONS_STORAGE_KEY, JSON.stringify(json));
        } catch (error) {
            warning(false, "Failed to save applied view transitions in sessionStorage (" + error + ").");
        }
    }
}
//#endregion
 //# sourceMappingURL=router.js.map
}),
"313": (function (__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
"use strict";
/* harmony import */var _useObserver__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("749");

function ObserverComponent(_a) {
    var children = _a.children, render = _a.render;
    var component = children || render;
    if (typeof component !== "function") return null;
    return (0, _useObserver__WEBPACK_IMPORTED_MODULE_0__/* .useObserver */.S)(component);
}
ObserverComponent.displayName = "Observer";

function ObserverPropsCheck(props, key, componentName, location, propFullName) {
    var extraKey = key === "children" ? "render" : "children";
    var hasProp = typeof props[key] === "function";
    var hasExtraProp = typeof props[extraKey] === "function";
    if (hasProp && hasExtraProp) return new Error("MobX Observer: Do not use children and render in the same time in`" + componentName);
    if (hasProp || hasExtraProp) return null;
    return new Error("Invalid prop `" + propFullName + "` of type `" + typeof props[key] + "` supplied to" + " `" + componentName + "`, expected `function`.");
} //# sourceMappingURL=ObserverComponent.js.map
}),
"139": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  FY: function() { return /* reexport safe */ _staticRendering__WEBPACK_IMPORTED_MODULE_4__.F; },
  Pi: function() { return /* reexport safe */ _observer__WEBPACK_IMPORTED_MODULE_5__.P; },
  jd: function() { return /* reexport safe */ _utils_observerFinalizationRegistry__WEBPACK_IMPORTED_MODULE_3__.O; }
});
/* harmony import */var _utils_assertEnvironment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("939");
/* harmony import */var _utils_reactBatchedUpdates__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("212");
/* harmony import */var _utils_observerBatching__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__("642");
/* harmony import */var _useObserver__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("749");
/* harmony import */var _utils_observerFinalizationRegistry__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("784");
/* harmony import */var _staticRendering__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("310");
/* harmony import */var _observer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("743");
/* harmony import */var _ObserverComponent__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__("313");
/* harmony import */var _useLocalObservable__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__("862");
/* harmony import */var _useLocalStore__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__("434");
/* harmony import */var _useAsObservableSource__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__("329");
var _a;







(0, _utils_observerBatching__WEBPACK_IMPORTED_MODULE_10__/* .observerBatching */.z0)(_utils_reactBatchedUpdates__WEBPACK_IMPORTED_MODULE_1__/* .unstable_batchedUpdates */.m);







var clearTimers = (_a = _utils_observerFinalizationRegistry__WEBPACK_IMPORTED_MODULE_3__/* .observerFinalizationRegistry.finalizeAllImmediately */.O.finalizeAllImmediately) !== null && _a !== void 0 ? _a : function() {};
function useObserver(fn, baseComponentName) {
    if (baseComponentName === void 0) baseComponentName = "observed";
    return useObserverOriginal(fn, baseComponentName);
}

function useStaticRendering(enable) {
    enableStaticRendering(enable);
} //# sourceMappingURL=index.js.map
}),
"743": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  P: function() { return observer; }
});
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");
/* harmony import */var _staticRendering__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("310");
/* harmony import */var _useObserver__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("749");
var _a, _b;



var warnObserverOptionsDeprecated = true;
var hasSymbol = typeof Symbol === "function" && Symbol.for;
var isFunctionNameConfigurable = (_b = (_a = Object.getOwnPropertyDescriptor(function() {}, "name")) === null || _a === void 0 ? void 0 : _a.configurable) !== null && _b !== void 0 ? _b : false;
// Using react-is had some issues (and operates on elements, not on types), see #608 / #609
var ReactForwardRefSymbol = hasSymbol ? Symbol.for("react.forward_ref") : typeof react__WEBPACK_IMPORTED_MODULE_0__.forwardRef === "function" && (0, react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(function(props) {
    return null;
})["$$typeof"];
var ReactMemoSymbol = hasSymbol ? Symbol.for("react.memo") : typeof react__WEBPACK_IMPORTED_MODULE_0__.memo === "function" && (0, react__WEBPACK_IMPORTED_MODULE_0__.memo)(function(props) {
    return null;
})["$$typeof"];
// n.b. base case is not used for actual typings or exported in the typing files
function observer(baseComponent, // TODO remove in next major
options) {
    var _a;
    if (ReactMemoSymbol && baseComponent["$$typeof"] === ReactMemoSymbol) throw new Error("[mobx-react-lite] You are trying to use `observer` on a function component wrapped in either another `observer` or `React.memo`. The observer already applies 'React.memo' for you.");
    // The working of observer is explained step by step in this talk: https://www.youtube.com/watch?v=cPF4iBedoF0&feature=youtu.be&t=1307
    if ((0, _staticRendering__WEBPACK_IMPORTED_MODULE_2__/* .isUsingStaticRendering */.F)()) return baseComponent;
    var useForwardRef = (_a = options === null || options === void 0 ? void 0 : options.forwardRef) !== null && _a !== void 0 ? _a : false;
    var render = baseComponent;
    var baseComponentName = baseComponent.displayName || baseComponent.name;
    // If already wrapped with forwardRef, unwrap,
    // so we can patch render and apply memo
    if (ReactForwardRefSymbol && baseComponent["$$typeof"] === ReactForwardRefSymbol) {
        useForwardRef = true;
        render = baseComponent["render"];
        if (typeof render !== "function") throw new Error("[mobx-react-lite] `render` property of ForwardRef was not a function");
    }
    var observerComponent = function(props, ref) {
        return (0, _useObserver__WEBPACK_IMPORTED_MODULE_1__/* .useObserver */.S)(function() {
            return render(props, ref);
        }, baseComponentName);
    };
    observerComponent.displayName = baseComponent.displayName;
    if (isFunctionNameConfigurable) Object.defineProperty(observerComponent, "name", {
        value: baseComponent.name,
        writable: true,
        configurable: true
    });
    // Support legacy context: `contextTypes` must be applied before `memo`
    if (baseComponent.contextTypes) observerComponent.contextTypes = baseComponent.contextTypes;
    if (useForwardRef) // `forwardRef` must be applied prior `memo`
    // `forwardRef(observer(cmp))` throws:
    // "forwardRef requires a render function but received a `memo` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...))"
    observerComponent = (0, react__WEBPACK_IMPORTED_MODULE_0__.forwardRef)(observerComponent);
    // memo; we are not interested in deep updates
    // in props; we assume that if deep objects are changed,
    // this is in observables, which would have been tracked anyway
    observerComponent = (0, react__WEBPACK_IMPORTED_MODULE_0__.memo)(observerComponent);
    copyStaticProperties(baseComponent, observerComponent);
    return observerComponent;
}
// based on https://github.com/mridgway/hoist-non-react-statics/blob/master/src/index.js
var hoistBlackList = {
    $$typeof: true,
    render: true,
    compare: true,
    type: true,
    // Don't redefine `displayName`,
    // it's defined as getter-setter pair on `memo` (see #3192).
    displayName: true
};
function copyStaticProperties(base, target) {
    Object.keys(base).forEach(function(key) {
        if (!hoistBlackList[key]) Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key));
    });
} //# sourceMappingURL=observer.js.map
}),
"310": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  F: function() { return isUsingStaticRendering; }
});
var globalIsUsingStaticRendering = false;
function enableStaticRendering(enable) {
    globalIsUsingStaticRendering = enable;
}
function isUsingStaticRendering() {
    return globalIsUsingStaticRendering;
} //# sourceMappingURL=staticRendering.js.map
}),
"329": (function (__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
"use strict";
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");



function useAsObservableSource(current) {
    // We're deliberately not using idiomatic destructuring for the hook here.
    // Accessing the state value as an array element prevents TypeScript from generating unnecessary helpers in the resulting code.
    // For further details, please refer to mobxjs/mobx#3842.
    var res = useState(function() {
        return observable(current, {}, {
            deep: false
        });
    })[0];
    runInAction(function() {
        Object.assign(res, current);
    });
    return res;
} //# sourceMappingURL=useAsObservableSource.js.map
}),
"862": (function (__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
"use strict";
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");


function useLocalObservable(initializer, annotations) {
    return useState(function() {
        return observable(initializer(), annotations, {
            autoBind: true
        });
    })[0];
} //# sourceMappingURL=useLocalObservable.js.map
}),
"434": (function (__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
"use strict";
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");
/* harmony import */var _useAsObservableSource__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("329");




function useLocalStore(initializer, current) {
    var source = current && useAsObservableSource(current);
    return useState(function() {
        return observable(initializer(source), undefined, {
            autoBind: true
        });
    })[0];
} //# sourceMappingURL=useLocalStore.js.map
}),
"749": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  S: function() { return useObserver; }
});
/* harmony import */var mobx__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("588");
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");
/* harmony import */var _utils_printDebugValue__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__("630");
/* harmony import */var _staticRendering__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__("310");
/* harmony import */var _utils_observerFinalizationRegistry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("784");
/* harmony import */var use_sync_external_store_shim__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("644");






function createReaction(adm) {
    adm.reaction = new mobx__WEBPACK_IMPORTED_MODULE_3__/* .Reaction */.le("observer".concat(adm.name), function() {
        var _a;
        adm.stateVersion = Symbol();
        // onStoreChange won't be available until the component "mounts".
        // If state changes in between initial render and mount,
        // `useSyncExternalStore` should handle that by checking the state version and issuing update.
        (_a = adm.onStoreChange) === null || _a === void 0 || _a.call(adm);
    });
}
function useObserver(render, baseComponentName) {
    if (baseComponentName === void 0) baseComponentName = "observed";
    if ((0, _staticRendering__WEBPACK_IMPORTED_MODULE_4__/* .isUsingStaticRendering */.F)()) return render();
    var admRef = react__WEBPACK_IMPORTED_MODULE_0__.useRef(null);
    if (!admRef.current) {
        // First render
        var adm_1 = {
            reaction: null,
            onStoreChange: null,
            stateVersion: Symbol(),
            name: baseComponentName,
            subscribe: function(onStoreChange) {
                // Do NOT access admRef here!
                _utils_observerFinalizationRegistry__WEBPACK_IMPORTED_MODULE_1__/* .observerFinalizationRegistry.unregister */.O.unregister(adm_1);
                adm_1.onStoreChange = onStoreChange;
                if (!adm_1.reaction) {
                    // We've lost our reaction and therefore all subscriptions, occurs when:
                    // 1. Timer based finalization registry disposed reaction before component mounted.
                    // 2. React "re-mounts" same component without calling render in between (typically <StrictMode>).
                    // We have to recreate reaction and schedule re-render to recreate subscriptions,
                    // even if state did not change.
                    createReaction(adm_1);
                    // `onStoreChange` won't force update if subsequent `getSnapshot` returns same value.
                    // So we make sure that is not the case
                    adm_1.stateVersion = Symbol();
                }
                return function() {
                    var _a;
                    // Do NOT access admRef here!
                    adm_1.onStoreChange = null;
                    (_a = adm_1.reaction) === null || _a === void 0 || _a.dispose();
                    adm_1.reaction = null;
                };
            },
            getSnapshot: function() {
                // Do NOT access admRef here!
                return adm_1.stateVersion;
            }
        };
        admRef.current = adm_1;
    }
    var adm = admRef.current;
    if (!adm.reaction) {
        // First render or reaction was disposed by registry before subscribe
        createReaction(adm);
        // StrictMode/ConcurrentMode/Suspense may mean that our component is
        // rendered and abandoned multiple times, so we need to track leaked
        // Reactions.
        _utils_observerFinalizationRegistry__WEBPACK_IMPORTED_MODULE_1__/* .observerFinalizationRegistry.register */.O.register(admRef, adm, adm);
    }
    react__WEBPACK_IMPORTED_MODULE_0__.useDebugValue(adm.reaction, (0, _utils_printDebugValue__WEBPACK_IMPORTED_MODULE_5__/* .printDebugValue */.e));
    (0, use_sync_external_store_shim__WEBPACK_IMPORTED_MODULE_2__.useSyncExternalStore)(// Both of these must be stable, otherwise it would keep resubscribing every render.
    adm.subscribe, adm.getSnapshot, adm.getSnapshot);
    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes
    var renderResult;
    var exception;
    adm.reaction.track(function() {
        try {
            renderResult = render();
        } catch (e) {
            exception = e;
        }
    });
    if (exception) throw exception; // re-throw any exceptions caught during rendering
    return renderResult;
} //# sourceMappingURL=useObserver.js.map
}),
"507": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  SB: function() { return UniversalFinalizationRegistry; }
});
var REGISTRY_FINALIZE_AFTER = 10000;
var REGISTRY_SWEEP_INTERVAL = 10000;
var TimerBasedFinalizationRegistry = /** @class */ function() {
    function TimerBasedFinalizationRegistry(finalize) {
        var _this = this;
        Object.defineProperty(this, "finalize", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: finalize
        });
        Object.defineProperty(this, "registrations", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
        Object.defineProperty(this, "sweepTimeout", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        // Bound so it can be used directly as setTimeout callback.
        Object.defineProperty(this, "sweep", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: function(maxAge) {
                if (maxAge === void 0) maxAge = REGISTRY_FINALIZE_AFTER;
                // cancel timeout so we can force sweep anytime
                clearTimeout(_this.sweepTimeout);
                _this.sweepTimeout = undefined;
                var now = Date.now();
                _this.registrations.forEach(function(registration, token) {
                    if (now - registration.registeredAt >= maxAge) {
                        _this.finalize(registration.value);
                        _this.registrations.delete(token);
                    }
                });
                if (_this.registrations.size > 0) _this.scheduleSweep();
            }
        });
        // Bound so it can be exported directly as clearTimers test utility.
        Object.defineProperty(this, "finalizeAllImmediately", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: function() {
                _this.sweep(0);
            }
        });
    }
    // Token is actually required with this impl
    Object.defineProperty(TimerBasedFinalizationRegistry.prototype, "register", {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(target, value, token) {
            this.registrations.set(token, {
                value: value,
                registeredAt: Date.now()
            });
            this.scheduleSweep();
        }
    });
    Object.defineProperty(TimerBasedFinalizationRegistry.prototype, "unregister", {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function(token) {
            this.registrations.delete(token);
        }
    });
    Object.defineProperty(TimerBasedFinalizationRegistry.prototype, "scheduleSweep", {
        enumerable: false,
        configurable: true,
        writable: true,
        value: function() {
            if (this.sweepTimeout === undefined) this.sweepTimeout = setTimeout(this.sweep, REGISTRY_SWEEP_INTERVAL);
        }
    });
    return TimerBasedFinalizationRegistry;
}();

var UniversalFinalizationRegistry = typeof FinalizationRegistry !== "undefined" ? FinalizationRegistry : TimerBasedFinalizationRegistry; //# sourceMappingURL=UniversalFinalizationRegistry.js.map
}),
"939": (function (__unused_webpack_module, __unused_webpack___webpack_exports__, __webpack_require__) {
"use strict";
/* harmony import */var mobx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("588");
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");


if (!react__WEBPACK_IMPORTED_MODULE_0__.useState) throw new Error("mobx-react-lite requires React with Hooks support");
if (!mobx__WEBPACK_IMPORTED_MODULE_1__/* .makeObservable */.rC) throw new Error("mobx-react-lite@3 requires mobx at least version 6 to be available");
 //# sourceMappingURL=assertEnvironment.js.map
}),
"642": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  z0: function() { return observerBatching; }
});
/* harmony import */var mobx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("588");

function defaultNoopBatch(callback) {
    callback();
}
function observerBatching(reactionScheduler) {
    if (!reactionScheduler) reactionScheduler = defaultNoopBatch;
    (0, mobx__WEBPACK_IMPORTED_MODULE_0__/* .configure */.jQ)({
        reactionScheduler: reactionScheduler
    });
}
var isObserverBatched = function() {
    return true;
}; //# sourceMappingURL=observerBatching.js.map
}),
"784": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  O: function() { return observerFinalizationRegistry; }
});
/* harmony import */var _UniversalFinalizationRegistry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("507");

var observerFinalizationRegistry = new _UniversalFinalizationRegistry__WEBPACK_IMPORTED_MODULE_0__/* .UniversalFinalizationRegistry */.SB(function(adm) {
    var _a;
    (_a = adm.reaction) === null || _a === void 0 || _a.dispose();
    adm.reaction = null;
}); //# sourceMappingURL=observerFinalizationRegistry.js.map
}),
"630": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  e: function() { return printDebugValue; }
});
/* harmony import */var mobx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("588");

function printDebugValue(v) {
    return (0, mobx__WEBPACK_IMPORTED_MODULE_0__/* .getDependencyTree */.Gf)(v);
} //# sourceMappingURL=printDebugValue.js.map
}),
"212": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  m: function() { return /* reexport safe */ react_dom__WEBPACK_IMPORTED_MODULE_0__.unstable_batchedUpdates; }
});
/* harmony import */var react_dom__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("542");
 //# sourceMappingURL=reactBatchedUpdates.js.map
}),
"649": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  Pi: function() { return observer; }
});
/* harmony import */var mobx__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("588");
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");
/* harmony import */var mobx_react_lite__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("139");




function shallowEqual(objA, objB) {
    //From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
    if (is(objA, objB)) return true;
    if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) return false;
    var keysA = Object.keys(objA);
    var keysB = Object.keys(objB);
    if (keysA.length !== keysB.length) return false;
    for(var i = 0; i < keysA.length; i++){
        if (!Object.hasOwnProperty.call(objB, keysA[i]) || !is(objA[keysA[i]], objB[keysA[i]])) return false;
    }
    return true;
}
function is(x, y) {
    // From: https://github.com/facebook/fbjs/blob/c69904a511b900266935168223063dd8772dfc40/packages/fbjs/src/core/shallowEqual.js
    if (x === y) return x !== 0 || 1 / x === 1 / y;
    else return x !== x && y !== y;
}
// based on https://github.com/mridgway/hoist-non-react-statics/blob/master/src/index.js
var hoistBlackList = (/* unused pure expression or super */ null && ({
    $$typeof: 1,
    render: 1,
    compare: 1,
    type: 1,
    childContextTypes: 1,
    contextType: 1,
    contextTypes: 1,
    defaultProps: 1,
    getDefaultProps: 1,
    getDerivedStateFromError: 1,
    getDerivedStateFromProps: 1,
    mixins: 1,
    displayName: 1,
    propTypes: 1
}));
function copyStaticProperties(base, target) {
    var protoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(base));
    Object.getOwnPropertyNames(base).forEach(function(key) {
        if (!hoistBlackList[key] && protoProps.indexOf(key) === -1) Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key));
    });
}
/**
 * Utilities for patching componentWillUnmount, to make sure @disposeOnUnmount works correctly icm with user defined hooks
 * and the handler provided by mobx-react
 */ var mobxMixins = /*#__PURE__*/ Symbol("patchMixins");
var mobxPatchedDefinition = /*#__PURE__*/ Symbol("patchedDefinition");
function getMixins(target, methodName) {
    var mixins = target[mobxMixins] = target[mobxMixins] || {};
    var methodMixins = mixins[methodName] = mixins[methodName] || {};
    methodMixins.locks = methodMixins.locks || 0;
    methodMixins.methods = methodMixins.methods || [];
    return methodMixins;
}
function wrapper(realMethod, mixins) {
    var _this = this;
    for(var _len = arguments.length, args = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++)args[_key - 2] = arguments[_key];
    // locks are used to ensure that mixins are invoked only once per invocation, even on recursive calls
    mixins.locks++;
    try {
        var retVal;
        if (realMethod !== undefined && realMethod !== null) retVal = realMethod.apply(this, args);
        return retVal;
    } finally{
        mixins.locks--;
        if (mixins.locks === 0) mixins.methods.forEach(function(mx) {
            mx.apply(_this, args);
        });
    }
}
function wrapFunction(realMethod, mixins) {
    var fn = function fn() {
        for(var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++)args[_key2] = arguments[_key2];
        wrapper.call.apply(wrapper, [
            this,
            realMethod,
            mixins
        ].concat(args));
    };
    return fn;
}
function patch(target, methodName, mixinMethod) {
    var mixins = getMixins(target, methodName);
    if (mixins.methods.indexOf(mixinMethod) < 0) mixins.methods.push(mixinMethod);
    var oldDefinition = Object.getOwnPropertyDescriptor(target, methodName);
    if (oldDefinition && oldDefinition[mobxPatchedDefinition]) // already patched definition, do not repatch
    return;
    var originalMethod = target[methodName];
    var newDefinition = createDefinition(target, methodName, oldDefinition ? oldDefinition.enumerable : undefined, mixins, originalMethod);
    Object.defineProperty(target, methodName, newDefinition);
}
function createDefinition(target, methodName, enumerable, mixins, originalMethod) {
    var _ref;
    var wrappedFunc = wrapFunction(originalMethod, mixins);
    return _ref = {}, _ref[mobxPatchedDefinition] = true, _ref.get = function get() {
        return wrappedFunc;
    }, _ref.set = function set(value) {
        if (this === target) wrappedFunc = wrapFunction(value, mixins);
        else {
            // when it is an instance of the prototype/a child prototype patch that particular case again separately
            // since we need to store separate values depending on wether it is the actual instance, the prototype, etc
            // e.g. the method for super might not be the same as the method for the prototype which might be not the same
            // as the method for the instance
            var newDefinition = createDefinition(this, methodName, enumerable, mixins, value);
            Object.defineProperty(this, methodName, newDefinition);
        }
    }, _ref.configurable = true, _ref.enumerable = enumerable, _ref;
}
var administrationSymbol = /*#__PURE__*/ Symbol("ObserverAdministration");
var isMobXReactObserverSymbol = /*#__PURE__*/ Symbol("isMobXReactObserver");
var observablePropDescriptors;
function getAdministration(component) {
    var _component$administra;
    // We create administration lazily, because we can't patch constructor
    // and the exact moment of initialization partially depends on React internals.
    // At the time of writing this, the first thing invoked is one of the observable getter/setter (state/props/context).
    return (_component$administra = component[administrationSymbol]) != null ? _component$administra : component[administrationSymbol] = {
        reaction: null,
        mounted: false,
        reactionInvalidatedBeforeMount: false,
        forceUpdate: null,
        name: getDisplayName(component.constructor),
        state: undefined,
        props: undefined,
        context: undefined
    };
}
function makeClassComponentObserver(componentClass) {
    var prototype = componentClass.prototype;
    if (componentClass[isMobXReactObserverSymbol]) {
        var displayName = getDisplayName(componentClass);
        throw new Error("The provided component class (" + displayName + ") has already been declared as an observer component.");
    } else componentClass[isMobXReactObserverSymbol] = true;
    if (prototype.componentWillReact) throw new Error("The componentWillReact life-cycle event is no longer supported");
    if (componentClass["__proto__"] !== react__WEBPACK_IMPORTED_MODULE_0__.PureComponent) {
        if (!prototype.shouldComponentUpdate) prototype.shouldComponentUpdate = observerSCU;
        else if (prototype.shouldComponentUpdate !== observerSCU) // n.b. unequal check, instead of existence check, as @observer might be on superclass as well
        throw new Error("It is not allowed to use shouldComponentUpdate in observer based components.");
    }
    var originalRender = prototype.render;
    if (typeof originalRender !== "function") {
        var _displayName = getDisplayName(componentClass);
        throw new Error("[mobx-react] class component (" + _displayName + ") is missing `render` method." + "\n`observer` requires `render` being a function defined on prototype." + "\n`render = () => {}` or `render = function() {}` is not supported.");
    }
    prototype.render = function() {
        Object.defineProperty(this, "render", {
            // There is no safe way to replace render, therefore it's forbidden.
            configurable: false,
            writable: false,
            value: (0, mobx_react_lite__WEBPACK_IMPORTED_MODULE_1__/* .isUsingStaticRendering */.FY)() ? originalRender : createReactiveRender.call(this, originalRender)
        });
        return this.render();
    };
    var originalComponentDidMount = prototype.componentDidMount;
    prototype.componentDidMount = function() {
        var _this = this;
        var _displayName2;
        // `componentDidMount` may not be called at all. React can abandon the instance after `render`.
        // That's why we use finalization registry to dispose reaction created during render.
        // Happens with `<Suspend>` see #3492
        //
        // `componentDidMount` can be called immediately after `componentWillUnmount` without calling `render` in between.
        // Happens with `<StrictMode>`see #3395.
        //
        // If `componentDidMount` is called, it's guaranteed to run synchronously with render (similary to `useLayoutEffect`).
        // Therefore we don't have to worry about external (observable) state being updated before mount (no state version checking).
        //
        // Things may change: "In the future, React will provide a feature that lets components preserve state between unmounts"
        var admin = getAdministration(this);
        admin.mounted = true;
        // Component instance committed, prevent reaction disposal.
        mobx_react_lite__WEBPACK_IMPORTED_MODULE_1__/* ._observerFinalizationRegistry.unregister */.jd.unregister(this);
        // We don't set forceUpdate before mount because it requires a reference to `this`,
        // therefore `this` could NOT be garbage collected before mount,
        // preventing reaction disposal by FinalizationRegistry and leading to memory leak.
        // As an alternative we could have `admin.instanceRef = new WeakRef(this)`, but lets avoid it if possible.
        admin.forceUpdate = function() {
            return _this.forceUpdate();
        };
        if (!admin.reaction || admin.reactionInvalidatedBeforeMount) // Missing reaction:
        // 1. Instance was unmounted (reaction disposed) and immediately remounted without running render #3395.
        // 2. Reaction was disposed by finalization registry before mount. Shouldn't ever happen for class components:
        // `componentDidMount` runs synchronously after render, but our registry are deferred (can't run in between).
        // In any case we lost subscriptions to observables, so we have to create new reaction and re-render to resubscribe.
        // The reaction will be created lazily by following render.
        // Reaction invalidated before mount:
        // 1. A descendant's `componenDidMount` invalidated it's parent #3730
        admin.forceUpdate();
        return originalComponentDidMount == null ? void 0 : originalComponentDidMount.apply(this, arguments);
    };
    // TODO@major Overly complicated "patch" is only needed to support the deprecated @disposeOnUnmount
    patch(prototype, "componentWillUnmount", function() {
        var _admin$reaction;
        if ((0, mobx_react_lite__WEBPACK_IMPORTED_MODULE_1__/* .isUsingStaticRendering */.FY)()) return;
        var admin = getAdministration(this);
        (_admin$reaction = admin.reaction) == null || _admin$reaction.dispose();
        admin.reaction = null;
        admin.forceUpdate = null;
        admin.mounted = false;
        admin.reactionInvalidatedBeforeMount = false;
    });
    return componentClass;
}
// Generates a friendly name for debugging
function getDisplayName(componentClass) {
    return componentClass.displayName || componentClass.name || "<component>";
}
function createReactiveRender(originalRender) {
    var boundOriginalRender = originalRender.bind(this);
    var admin = getAdministration(this);
    function reactiveRender() {
        if (!admin.reaction) {
            // Create reaction lazily to support re-mounting #3395
            admin.reaction = createReaction(admin);
            if (!admin.mounted) // React can abandon this instance and never call `componentDidMount`/`componentWillUnmount`,
            // we have to make sure reaction will be disposed.
            mobx_react_lite__WEBPACK_IMPORTED_MODULE_1__/* ._observerFinalizationRegistry.register */.jd.register(this, admin, this);
        }
        var error = undefined;
        var renderResult = undefined;
        admin.reaction.track(function() {
            try {
                // TODO@major
                // Optimization: replace with _allowStateChangesStart/End (not available in mobx@6.0.0)
                renderResult = (0, mobx__WEBPACK_IMPORTED_MODULE_2__/* ._allowStateChanges */.$$)(false, boundOriginalRender);
            } catch (e) {
                error = e;
            }
        });
        if (error) throw error;
        return renderResult;
    }
    return reactiveRender;
}
function createReaction(admin) {
    return new mobx__WEBPACK_IMPORTED_MODULE_2__/* .Reaction */.le(admin.name + ".render()", function() {
        if (!admin.mounted) {
            // This is neccessary to avoid react warning about calling forceUpdate on component that isn't mounted yet.
            // This happens when component is abandoned after render - our reaction is already created and reacts to changes.
            // `componenDidMount` runs synchronously after `render`, so unlike functional component, there is no delay during which the reaction could be invalidated.
            // However `componentDidMount` runs AFTER it's descendants' `componentDidMount`, which CAN invalidate the reaction, see #3730. Therefore remember and forceUpdate on mount.
            admin.reactionInvalidatedBeforeMount = true;
            return;
        }
        try {
            admin.forceUpdate == null || admin.forceUpdate();
        } catch (error) {
            var _admin$reaction2;
            (_admin$reaction2 = admin.reaction) == null || _admin$reaction2.dispose();
            admin.reaction = null;
        }
    });
}
function observerSCU(nextProps, nextState) {
    if ((0, mobx_react_lite__WEBPACK_IMPORTED_MODULE_1__/* .isUsingStaticRendering */.FY)()) console.warn("[mobx-react] It seems that a re-rendering of a React component is triggered while in static (server-side) mode. Please make sure components are rendered only once server-side.");
    // update on any state changes (as is the default)
    if (this.state !== nextState) return true;
    // update if props are shallowly not equal, inspired by PureRenderMixin
    // we could return just 'false' here, and avoid the `skipRender` checks etc
    // however, it is nicer if lifecycle events are triggered like usually,
    // so we return true here if props are shallowly modified.
    return !shallowEqual(this.props, nextProps);
}
function createObservablePropDescriptor(key) {
    return {
        configurable: true,
        enumerable: true,
        get: function get() {
            var admin = getAdministration(this);
            var derivation = _getGlobalState().trackingDerivation;
            if (derivation && derivation !== admin.reaction) throw new Error("[mobx-react] Cannot read \"" + admin.name + "." + key + "\" in a reactive context, as it isn't observable.\n                    Please use component lifecycle method to copy the value into a local observable first.\n                    See https://github.com/mobxjs/mobx/blob/main/packages/mobx-react/README.md#note-on-using-props-and-state-in-derivations");
            return admin[key];
        },
        set: function set(value) {
            getAdministration(this)[key] = value;
        }
    };
}
function observer(component, context) {
    if (context && context.kind !== "class") throw new Error("The @observer decorator can be used on classes only");
    if (component["isMobxInjector"] === true) console.warn("Mobx observer: You are trying to use `observer` on a component that already has `inject`. Please apply `observer` before applying `inject`");
    if (Object.prototype.isPrototypeOf.call(react__WEBPACK_IMPORTED_MODULE_0__.Component, component) || Object.prototype.isPrototypeOf.call(react__WEBPACK_IMPORTED_MODULE_0__.PureComponent, component)) // Class component
    return makeClassComponentObserver(component);
    else // Function component
    return (0, mobx_react_lite__WEBPACK_IMPORTED_MODULE_1__/* .observer */.Pi)(component);
}
function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
var _excluded = [
    "children"
];
var MobXProviderContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext({});
function Provider(props) {
    var children = props.children, stores = _objectWithoutPropertiesLoose(props, _excluded);
    var parentValue = react__WEBPACK_IMPORTED_MODULE_0__.useContext(MobXProviderContext);
    var mutableProviderRef = react__WEBPACK_IMPORTED_MODULE_0__.useRef(_extends({}, parentValue, stores));
    var value = mutableProviderRef.current;
    var newValue;
    return react__WEBPACK_IMPORTED_MODULE_0__.createElement(MobXProviderContext.Provider, {
        value: value
    }, children);
}
Provider.displayName = "MobXProvider";
/**
 * Store Injection
 */ function createStoreInjector(grabStoresFn, component, injectNames, makeReactive) {
    // Support forward refs
    var Injector = React__default.forwardRef(function(props, ref) {
        var newProps = _extends({}, props);
        var context = React__default.useContext(MobXProviderContext);
        Object.assign(newProps, grabStoresFn(context || {}, newProps) || {});
        if (ref) newProps.ref = ref;
        return React__default.createElement(component, newProps);
    });
    if (makeReactive) Injector = observer(Injector);
    Injector["isMobxInjector"] = true; // assigned late to suppress observer warning
    // Static fields from component should be visible on the generated Injector
    copyStaticProperties(component, Injector);
    Injector["wrappedComponent"] = component;
    Injector.displayName = getInjectName(component, injectNames);
    return Injector;
}
function getInjectName(component, injectNames) {
    var displayName;
    var componentName = component.displayName || component.name || component.constructor && component.constructor.name || "Component";
    if (injectNames) displayName = "inject-with-" + injectNames + "(" + componentName + ")";
    else displayName = "inject(" + componentName + ")";
    return displayName;
}
function grabStoresByName(storeNames) {
    return function(baseStores, nextProps) {
        storeNames.forEach(function(storeName) {
            if (storeName in nextProps // prefer props over stores
            ) return;
            if (!(storeName in baseStores)) throw new Error("MobX injector: Store '" + storeName + "' is not available! Make sure it is provided by some Provider");
            nextProps[storeName] = baseStores[storeName];
        });
        return nextProps;
    };
}
/**
 * higher order component that injects stores to a child.
 * takes either a varargs list of strings, which are stores read from the context,
 * or a function that manually maps the available stores from the context to props:
 * storesToProps(mobxStores, props, context) => newProps
 */ function inject() {
    for(var _len = arguments.length, storeNames = new Array(_len), _key = 0; _key < _len; _key++)storeNames[_key] = arguments[_key];
    if (typeof arguments[0] === "function") {
        var grabStoresFn = arguments[0];
        return function(componentClass) {
            return createStoreInjector(grabStoresFn, componentClass, grabStoresFn.name, true);
        };
    } else return function(componentClass) {
        return createStoreInjector(grabStoresByName(storeNames), componentClass, storeNames.join("-"), false);
    };
}
var reactMajorVersion = /*#__PURE__*/ Number.parseInt(/*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.version.split(".")[0]);
var warnedAboutDisposeOnUnmountDeprecated = false;
var protoStoreKey = /*#__PURE__*/ (/* unused pure expression or super */ null && (Symbol("disposeOnUnmountProto")));
var instStoreKey = /*#__PURE__*/ (/* unused pure expression or super */ null && (Symbol("disposeOnUnmountInst")));
function runDisposersOnWillUnmount() {
    var _this = this;
    [].concat(this[protoStoreKey] || [], this[instStoreKey] || []).forEach(function(propKeyOrFunction) {
        var prop = typeof propKeyOrFunction === "string" ? _this[propKeyOrFunction] : propKeyOrFunction;
        if (prop !== undefined && prop !== null) {
            if (Array.isArray(prop)) prop.map(function(f) {
                return f();
            });
            else prop();
        }
    });
}
/**
 * @deprecated `disposeOnUnmount` is not compatible with React 18 and higher.
 */ function disposeOnUnmount(target, propertyKeyOrFunction) {
    if (Array.isArray(propertyKeyOrFunction)) return propertyKeyOrFunction.map(function(fn) {
        return disposeOnUnmount(target, fn);
    });
    if (!warnedAboutDisposeOnUnmountDeprecated) {
        if (reactMajorVersion >= 18) console.error("[mobx-react] disposeOnUnmount is not compatible with React 18 and higher. Don't use it.");
        else console.warn("[mobx-react] disposeOnUnmount is deprecated. It won't work correctly with React 18 and higher.");
        warnedAboutDisposeOnUnmountDeprecated = true;
    }
    var c = Object.getPrototypeOf(target).constructor;
    var c2 = Object.getPrototypeOf(target.constructor);
    // Special case for react-hot-loader
    var c3 = Object.getPrototypeOf(Object.getPrototypeOf(target));
    if (!(c === React__default.Component || c === React__default.PureComponent || c2 === React__default.Component || c2 === React__default.PureComponent || c3 === React__default.Component || c3 === React__default.PureComponent)) throw new Error("[mobx-react] disposeOnUnmount only supports direct subclasses of React.Component or React.PureComponent.");
    if (typeof propertyKeyOrFunction !== "string" && typeof propertyKeyOrFunction !== "function" && !Array.isArray(propertyKeyOrFunction)) throw new Error("[mobx-react] disposeOnUnmount only works if the parameter is either a property key or a function.");
    // decorator's target is the prototype, so it doesn't have any instance properties like props
    var isDecorator = typeof propertyKeyOrFunction === "string";
    // add property key / function we want run (disposed) to the store
    var componentWasAlreadyModified = !!target[protoStoreKey] || !!target[instStoreKey];
    var store = isDecorator ? // decorators are added to the prototype store
    target[protoStoreKey] || (target[protoStoreKey] = []) : // functions are added to the instance store
    target[instStoreKey] || (target[instStoreKey] = []);
    store.push(propertyKeyOrFunction);
    // tweak the component class componentWillUnmount if not done already
    if (!componentWasAlreadyModified) patch(target, "componentWillUnmount", runDisposersOnWillUnmount);
    // return the disposer as is if invoked as a non decorator
    if (typeof propertyKeyOrFunction !== "string") return propertyKeyOrFunction;
}
// Copied from React.PropTypes
function createChainableTypeChecker(validator) {
    function checkType(isRequired, props, propName, componentName, location, propFullName) {
        for(var _len = arguments.length, rest = new Array(_len > 6 ? _len - 6 : 0), _key = 6; _key < _len; _key++)rest[_key - 6] = arguments[_key];
        return (0, mobx__WEBPACK_IMPORTED_MODULE_2__/* .untracked */.rg)(function() {
            componentName = componentName || "<<anonymous>>";
            propFullName = propFullName || propName;
            if (props[propName] == null) {
                if (isRequired) {
                    var actual = props[propName] === null ? "null" : "undefined";
                    return new Error("The " + location + " `" + propFullName + "` is marked as required " + "in `" + componentName + "`, but its value is `" + actual + "`.");
                }
                return null;
            } else // @ts-ignore rest arg is necessary for some React internals - fails tests otherwise
            return validator.apply(void 0, [
                props,
                propName,
                componentName,
                location,
                propFullName
            ].concat(rest));
        });
    }
    var chainedCheckType = checkType.bind(null, false);
    // Add isRequired to satisfy Requirable
    chainedCheckType.isRequired = checkType.bind(null, true);
    return chainedCheckType;
}
// Copied from React.PropTypes
function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === "symbol") return true;
    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue["@@toStringTag"] === "Symbol") return true;
    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === "function" && propValue instanceof Symbol) return true;
    return false;
}
// Copied from React.PropTypes
function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) return "array";
    if (propValue instanceof RegExp) // Old webkits (at least until Android 4.0) return 'function' rather than
    // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
    // passes PropTypes.object.
    return "object";
    if (isSymbol(propType, propValue)) return "symbol";
    return propType;
}
// This handles more types than `getPropType`. Only used for error messages.
// Copied from React.PropTypes
function getPreciseType(propValue) {
    var propType = getPropType(propValue);
    if (propType === "object") {
        if (propValue instanceof Date) return "date";
        else if (propValue instanceof RegExp) return "regexp";
    }
    return propType;
}
function createObservableTypeCheckerCreator(allowNativeType, mobxType) {
    return createChainableTypeChecker(function(props, propName, componentName, location, propFullName) {
        return (0, mobx__WEBPACK_IMPORTED_MODULE_2__/* .untracked */.rg)(function() {
            if (allowNativeType) {
                if (getPropType(props[propName]) === mobxType.toLowerCase()) return null;
            }
            var mobxChecker;
            switch(mobxType){
                case "Array":
                    mobxChecker = mobx__WEBPACK_IMPORTED_MODULE_2__/* .isObservableArray */.Ei;
                    break;
                case "Object":
                    mobxChecker = mobx__WEBPACK_IMPORTED_MODULE_2__/* .isObservableObject */.Pb;
                    break;
                case "Map":
                    mobxChecker = mobx__WEBPACK_IMPORTED_MODULE_2__/* .isObservableMap */.LJ;
                    break;
                default:
                    throw new Error("Unexpected mobxType: " + mobxType);
            }
            var propValue = props[propName];
            if (!mobxChecker(propValue)) {
                var preciseType = getPreciseType(propValue);
                var nativeTypeExpectationMessage = allowNativeType ? " or javascript `" + mobxType.toLowerCase() + "`" : "";
                return new Error("Invalid prop `" + propFullName + "` of type `" + preciseType + "` supplied to" + " `" + componentName + "`, expected `mobx.Observable" + mobxType + "`" + nativeTypeExpectationMessage + ".");
            }
            return null;
        });
    });
}
function createObservableArrayOfTypeChecker(allowNativeType, typeChecker) {
    return createChainableTypeChecker(function(props, propName, componentName, location, propFullName) {
        for(var _len2 = arguments.length, rest = new Array(_len2 > 5 ? _len2 - 5 : 0), _key2 = 5; _key2 < _len2; _key2++)rest[_key2 - 5] = arguments[_key2];
        return (0, mobx__WEBPACK_IMPORTED_MODULE_2__/* .untracked */.rg)(function() {
            if (typeof typeChecker !== "function") return new Error("Property `" + propFullName + "` of component `" + componentName + "` has " + "invalid PropType notation.");
            else {
                var error = createObservableTypeCheckerCreator(allowNativeType, "Array")(props, propName, componentName, location, propFullName);
                if (error instanceof Error) return error;
                var propValue = props[propName];
                for(var i = 0; i < propValue.length; i++){
                    error = typeChecker.apply(void 0, [
                        propValue,
                        i,
                        componentName,
                        location,
                        propFullName + "[" + i + "]"
                    ].concat(rest));
                    if (error instanceof Error) return error;
                }
                return null;
            }
        });
    });
}
var observableArray = /*#__PURE__*/ createObservableTypeCheckerCreator(false, "Array");
var observableArrayOf = /*#__PURE__*/ createObservableArrayOfTypeChecker.bind(null, false);
var observableMap = /*#__PURE__*/ createObservableTypeCheckerCreator(false, "Map");
var observableObject = /*#__PURE__*/ createObservableTypeCheckerCreator(false, "Object");
var arrayOrObservableArray = /*#__PURE__*/ createObservableTypeCheckerCreator(true, "Array");
var arrayOrObservableArrayOf = /*#__PURE__*/ createObservableArrayOfTypeChecker.bind(null, true);
var objectOrObservableObject = /*#__PURE__*/ createObservableTypeCheckerCreator(true, "Object");
var PropTypes = (/* unused pure expression or super */ null && ({
    observableArray: observableArray,
    observableArrayOf: observableArrayOf,
    observableMap: observableMap,
    observableObject: observableObject,
    arrayOrObservableArray: arrayOrObservableArray,
    arrayOrObservableArrayOf: arrayOrObservableArrayOf,
    objectOrObservableObject: objectOrObservableObject
}));
if (!react__WEBPACK_IMPORTED_MODULE_0__.Component) throw new Error("mobx-react requires React to be available");
if (!mobx__WEBPACK_IMPORTED_MODULE_2__/* .observable */.LO) throw new Error("mobx-react requires mobx to be available");
 //# sourceMappingURL=mobxreact.esm.js.map
}),
"588": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
__webpack_require__.d(__webpack_exports__, {
  $$: function() { return allowStateChanges; },
  Ei: function() { return isObservableArray; },
  Gf: function() { return getDependencyTree; },
  LJ: function() { return isObservableMap; },
  LO: function() { return observable; },
  Pb: function() { return isObservableObject; },
  jQ: function() { return configure; },
  le: function() { return Reaction; },
  rC: function() { return makeObservable; },
  rg: function() { return untracked; }
});
var niceErrors = (/* unused pure expression or super */ null && ({
    0: "Invalid value for configuration 'enforceActions', expected 'never', 'always' or 'observed'",
    1: function _(annotationType, key) {
        return "Cannot apply '" + annotationType + "' to '" + key.toString() + "': Field not found.";
    },
    /*
  2(prop) {
      return `invalid decorator for '${prop.toString()}'`
  },
  3(prop) {
      return `Cannot decorate '${prop.toString()}': action can only be used on properties with a function value.`
  },
  4(prop) {
      return `Cannot decorate '${prop.toString()}': computed can only be used on getter properties.`
  },
  */ 5: "'keys()' can only be used on observable objects, arrays, sets and maps",
    6: "'values()' can only be used on observable objects, arrays, sets and maps",
    7: "'entries()' can only be used on observable objects, arrays and maps",
    8: "'set()' can only be used on observable objects, arrays and maps",
    9: "'remove()' can only be used on observable objects, arrays and maps",
    10: "'has()' can only be used on observable objects, arrays and maps",
    11: "'get()' can only be used on observable objects, arrays and maps",
    12: "Invalid annotation",
    13: "Dynamic observable objects cannot be frozen. If you're passing observables to 3rd party component/function that calls Object.freeze, pass copy instead: toJS(observable)",
    14: "Intercept handlers should return nothing or a change object",
    15: "Observable arrays cannot be frozen. If you're passing observables to 3rd party component/function that calls Object.freeze, pass copy instead: toJS(observable)",
    16: "Modification exception: the internal structure of an observable array was changed.",
    17: function _(index, length) {
        return "[mobx.array] Index out of bounds, " + index + " is larger than " + length;
    },
    18: "mobx.map requires Map polyfill for the current browser. Check babel-polyfill or core-js/es6/map.js",
    19: function _(other) {
        return "Cannot initialize from classes that inherit from Map: " + other.constructor.name;
    },
    20: function _(other) {
        return "Cannot initialize map from " + other;
    },
    21: function _(dataStructure) {
        return "Cannot convert to map from '" + dataStructure + "'";
    },
    22: "mobx.set requires Set polyfill for the current browser. Check babel-polyfill or core-js/es6/set.js",
    23: "It is not possible to get index atoms from arrays",
    24: function _(thing) {
        return "Cannot obtain administration from " + thing;
    },
    25: function _(property, name) {
        return "the entry '" + property + "' does not exist in the observable map '" + name + "'";
    },
    26: "please specify a property",
    27: function _(property, name) {
        return "no observable property '" + property.toString() + "' found on the observable object '" + name + "'";
    },
    28: function _(thing) {
        return "Cannot obtain atom from " + thing;
    },
    29: "Expecting some object",
    30: "invalid action stack. did you forget to finish an action?",
    31: "missing option for computed: get",
    32: function _(name, derivation) {
        return "Cycle detected in computation " + name + ": " + derivation;
    },
    33: function _(name) {
        return "The setter of computed value '" + name + "' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?";
    },
    34: function _(name) {
        return "[ComputedValue '" + name + "'] It is not possible to assign a new value to a computed value.";
    },
    35: "There are multiple, different versions of MobX active. Make sure MobX is loaded only once or use `configure({ isolateGlobalState: true })`",
    36: "isolateGlobalState should be called before MobX is running any reactions",
    37: function _(method) {
        return "[mobx] `observableArray." + method + "()` mutates the array in-place, which is not allowed inside a derivation. Use `array.slice()." + method + "()` instead";
    },
    38: "'ownKeys()' can only be used on observable objects",
    39: "'defineProperty()' can only be used on observable objects"
}));
var errors = (/* unused pure expression or super */ null && ({}));
function die(error) {
    for(var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++)args[_key - 1] = arguments[_key];
    var e;
    throw new Error(typeof error === "number" ? "[MobX] minified error nr: " + error + (args.length ? " " + args.map(String).join(",") : "") + ". Find the full error at: https://github.com/mobxjs/mobx/blob/main/packages/mobx/src/errors.ts" : "[MobX] " + error);
}
var mockGlobal = {};
function getGlobal() {
    if (typeof globalThis !== "undefined") return globalThis;
    if (typeof window !== "undefined") return window;
    if (typeof __webpack_require__.g !== "undefined") return __webpack_require__.g;
    if (typeof self !== "undefined") return self;
    return mockGlobal;
}
// We shorten anything used > 5 times
var assign = Object.assign;
var getDescriptor = Object.getOwnPropertyDescriptor;
var defineProperty = Object.defineProperty;
var objectPrototype = Object.prototype;
var EMPTY_ARRAY = [];
Object.freeze(EMPTY_ARRAY);
var EMPTY_OBJECT = {};
Object.freeze(EMPTY_OBJECT);
var hasProxy = typeof Proxy !== "undefined";
var plainObjectString = /*#__PURE__*/ Object.toString();
function assertProxies() {
    if (!hasProxy) die("Proxy not available");
}
function warnAboutProxyRequirement(msg) {}
function getNextId() {
    return ++globalState.mobxGuid;
}
/**
 * Makes sure that the provided function is invoked at most once.
 */ function once(func) {
    var invoked = false;
    return function() {
        if (invoked) return;
        invoked = true;
        return func.apply(this, arguments);
    };
}
var noop = function noop() {};
function isFunction(fn) {
    return typeof fn === "function";
}
function isStringish(value) {
    var t = typeof value;
    switch(t){
        case "string":
        case "symbol":
        case "number":
            return true;
    }
    return false;
}
function isObject(value) {
    return value !== null && typeof value === "object";
}
function isPlainObject(value) {
    if (!isObject(value)) return false;
    var proto = Object.getPrototypeOf(value);
    if (proto == null) return true;
    var protoConstructor = Object.hasOwnProperty.call(proto, "constructor") && proto.constructor;
    return typeof protoConstructor === "function" && protoConstructor.toString() === plainObjectString;
}
// https://stackoverflow.com/a/37865170
function isGenerator(obj) {
    var constructor = obj == null ? void 0 : obj.constructor;
    if (!constructor) return false;
    if ("GeneratorFunction" === constructor.name || "GeneratorFunction" === constructor.displayName) return true;
    return false;
}
function addHiddenProp(object, propName, value) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: true,
        configurable: true,
        value: value
    });
}
function addHiddenFinalProp(object, propName, value) {
    defineProperty(object, propName, {
        enumerable: false,
        writable: false,
        configurable: true,
        value: value
    });
}
function createInstanceofPredicate(name, theClass) {
    var propName = "isMobX" + name;
    theClass.prototype[propName] = true;
    return function(x) {
        return isObject(x) && x[propName] === true;
    };
}
/**
 * Yields true for both native and observable Map, even across different windows.
 */ function isES6Map(thing) {
    return thing != null && Object.prototype.toString.call(thing) === "[object Map]";
}
/**
 * Makes sure a Map is an instance of non-inherited native or observable Map.
 */ function isPlainES6Map(thing) {
    var mapProto = Object.getPrototypeOf(thing);
    var objectProto = Object.getPrototypeOf(mapProto);
    var nullProto = Object.getPrototypeOf(objectProto);
    return nullProto === null;
}
/**
 * Yields true for both native and observable Set, even across different windows.
 */ function isES6Set(thing) {
    return thing != null && Object.prototype.toString.call(thing) === "[object Set]";
}
var hasGetOwnPropertySymbols = typeof Object.getOwnPropertySymbols !== "undefined";
/**
 * Returns the following: own enumerable keys and symbols.
 */ function getPlainObjectKeys(object) {
    var keys = Object.keys(object);
    // Not supported in IE, so there are not going to be symbol props anyway...
    if (!hasGetOwnPropertySymbols) return keys;
    var symbols = Object.getOwnPropertySymbols(object);
    if (!symbols.length) return keys;
    return [].concat(keys, symbols.filter(function(s) {
        return objectPrototype.propertyIsEnumerable.call(object, s);
    }));
}
// From Immer utils
// Returns all own keys, including non-enumerable and symbolic
var ownKeys = typeof Reflect !== "undefined" && Reflect.ownKeys ? Reflect.ownKeys : hasGetOwnPropertySymbols ? function(obj) {
    return Object.getOwnPropertyNames(obj).concat(Object.getOwnPropertySymbols(obj));
} : /* istanbul ignore next */ Object.getOwnPropertyNames;
function stringifyKey(key) {
    if (typeof key === "string") return key;
    if (typeof key === "symbol") return key.toString();
    return new String(key).toString();
}
function toPrimitive(value) {
    return value === null ? null : typeof value === "object" ? "" + value : value;
}
function hasProp(target, prop) {
    return objectPrototype.hasOwnProperty.call(target, prop);
}
// From Immer utils
var getOwnPropertyDescriptors = Object.getOwnPropertyDescriptors || function getOwnPropertyDescriptors(target) {
    // Polyfill needed for Hermes and IE, see https://github.com/facebook/hermes/issues/274
    var res = {};
    // Note: without polyfill for ownKeys, symbols won't be picked up
    ownKeys(target).forEach(function(key) {
        res[key] = getDescriptor(target, key);
    });
    return res;
};
function getFlag(flags, mask) {
    return !!(flags & mask);
}
function setFlag(flags, mask, newValue) {
    if (newValue) flags |= mask;
    else flags &= ~mask;
    return flags;
}
function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for(var e = 0, n = Array(a); e < a; e++)n[e] = r[e];
    return n;
}
function _defineProperties(e, r) {
    for(var t = 0; t < r.length; t++){
        var o = r[t];
        o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
    }
}
function _createClass(e, r, t) {
    return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
        writable: !1
    }), e;
}
function _createForOfIteratorHelperLoose(r, e) {
    var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (t) return (t = t.call(r)).next.bind(t);
    if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) {
        t && (r = t);
        var o = 0;
        return function() {
            return o >= r.length ? {
                done: !0
            } : {
                done: !1,
                value: r[o++]
            };
        };
    }
    throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _extends() {
    return _extends = Object.assign ? Object.assign.bind() : function(n) {
        for(var e = 1; e < arguments.length; e++){
            var t = arguments[e];
            for(var r in t)({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
        }
        return n;
    }, _extends.apply(null, arguments);
}
function _inheritsLoose(t, o) {
    t.prototype = Object.create(o.prototype), t.prototype.constructor = t, _setPrototypeOf(t, o);
}
function _setPrototypeOf(t, e) {
    return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function(t, e) {
        return t.__proto__ = e, t;
    }, _setPrototypeOf(t, e);
}
function _toPrimitive(t, r) {
    if ("object" != typeof t || !t) return t;
    var e = t[Symbol.toPrimitive];
    if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
    var i = _toPrimitive(t, "string");
    return "symbol" == typeof i ? i : i + "";
}
function _unsupportedIterableToArray(r, a) {
    if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = ({}).toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
}
var storedAnnotationsSymbol = /*#__PURE__*/ Symbol("mobx-stored-annotations");
/**
 * Creates a function that acts as
 * - decorator
 * - annotation object
 */ function createDecoratorAnnotation(annotation) {
    function decorator(target, property) {
        if (is20223Decorator(property)) return annotation.decorate_20223_(target, property);
        else storeAnnotation(target, property, annotation);
    }
    return Object.assign(decorator, annotation);
}
/**
 * Stores annotation to prototype,
 * so it can be inspected later by `makeObservable` called from constructor
 */ function storeAnnotation(prototype, key, annotation) {
    if (!hasProp(prototype, storedAnnotationsSymbol)) addHiddenProp(prototype, storedAnnotationsSymbol, _extends({}, prototype[storedAnnotationsSymbol]));
    var fieldName;
    // Cannot re-decorate
    assertNotDecorated(prototype, annotation, key);
    // Ignore override
    if (!isOverride(annotation)) prototype[storedAnnotationsSymbol][key] = annotation;
}
function assertNotDecorated(prototype, annotation, key) {
    var fieldName, currentAnnotationType, requestedAnnotationType;
}
/**
 * Collects annotations from prototypes and stores them on target (instance)
 */ function collectStoredAnnotations(target) {
    if (!hasProp(target, storedAnnotationsSymbol)) // if (__DEV__ && !target[storedAnnotationsSymbol]) {
    //     die(
    //         `No annotations were passed to makeObservable, but no decorated members have been found either`
    //     )
    // }
    // We need a copy as we will remove annotation from the list once it's applied.
    addHiddenProp(target, storedAnnotationsSymbol, _extends({}, target[storedAnnotationsSymbol]));
    return target[storedAnnotationsSymbol];
}
function is20223Decorator(context) {
    return typeof context == "object" && typeof context["kind"] == "string";
}
function assert20223DecoratorType(context, types) {}
var $mobx = /*#__PURE__*/ Symbol("mobx administration");
var Atom = /*#__PURE__*/ function() {
    /**
   * Create a new atom. For debugging purposes it is recommended to give it a name.
   * The onBecomeObserved and onBecomeUnobserved callbacks can be used for resource management.
   */ function Atom(name_) {
        if (name_ === void 0) name_ = "Atom";
        this.name_ = void 0;
        this.flags_ = 0;
        this.observers_ = new Set();
        this.lastAccessedBy_ = 0;
        this.lowestObserverState_ = IDerivationState_.NOT_TRACKING_;
        // onBecomeObservedListeners
        this.onBOL = void 0;
        // onBecomeUnobservedListeners
        this.onBUOL = void 0;
        this.name_ = name_;
    }
    // for effective unobserving. BaseAtom has true, for extra optimization, so its onBecomeUnobserved never gets called, because it's not needed
    var _proto = Atom.prototype;
    _proto.onBO = function onBO() {
        if (this.onBOL) this.onBOL.forEach(function(listener) {
            return listener();
        });
    };
    _proto.onBUO = function onBUO() {
        if (this.onBUOL) this.onBUOL.forEach(function(listener) {
            return listener();
        });
    } /**
   * Invoke this method to notify mobx that your atom has been used somehow.
   * Returns true if there is currently a reactive context.
   */ ;
    _proto.reportObserved = function reportObserved$1() {
        return reportObserved(this);
    } /**
   * Invoke this method _after_ this method has changed to signal mobx that all its observers should invalidate.
   */ ;
    _proto.reportChanged = function reportChanged() {
        startBatch();
        propagateChanged(this);
        endBatch();
    };
    _proto.toString = function toString() {
        return this.name_;
    };
    return _createClass(Atom, [
        {
            key: "isBeingObserved",
            get: function get() {
                return getFlag(this.flags_, Atom.isBeingObservedMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Atom.isBeingObservedMask_, newValue);
            }
        },
        {
            key: "isPendingUnobservation",
            get: function get() {
                return getFlag(this.flags_, Atom.isPendingUnobservationMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Atom.isPendingUnobservationMask_, newValue);
            }
        },
        {
            key: "diffValue",
            get: function get() {
                return getFlag(this.flags_, Atom.diffValueMask_) ? 1 : 0;
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Atom.diffValueMask_, newValue === 1 ? true : false);
            }
        }
    ]);
}();
Atom.isBeingObservedMask_ = 1;
Atom.isPendingUnobservationMask_ = 2;
Atom.diffValueMask_ = 4;
var isAtom = /*#__PURE__*/ createInstanceofPredicate("Atom", Atom);
function createAtom(name, onBecomeObservedHandler, onBecomeUnobservedHandler) {
    if (onBecomeObservedHandler === void 0) onBecomeObservedHandler = noop;
    if (onBecomeUnobservedHandler === void 0) onBecomeUnobservedHandler = noop;
    var atom = new Atom(name);
    // default `noop` listener will not initialize the hook Set
    if (onBecomeObservedHandler !== noop) onBecomeObserved(atom, onBecomeObservedHandler);
    if (onBecomeUnobservedHandler !== noop) onBecomeUnobserved(atom, onBecomeUnobservedHandler);
    return atom;
}
function identityComparer(a, b) {
    return a === b;
}
function structuralComparer(a, b) {
    return deepEqual(a, b);
}
function shallowComparer(a, b) {
    return deepEqual(a, b, 1);
}
function defaultComparer(a, b) {
    if (Object.is) return Object.is(a, b);
    return a === b ? a !== 0 || 1 / a === 1 / b : a !== a && b !== b;
}
var comparer = {
    identity: identityComparer,
    structural: structuralComparer,
    "default": defaultComparer,
    shallow: shallowComparer
};
function deepEnhancer(v, _, name) {
    // it is an observable already, done
    if (isObservable(v)) return v;
    // something that can be converted and mutated?
    if (Array.isArray(v)) return observable.array(v, {
        name: name
    });
    if (isPlainObject(v)) return observable.object(v, undefined, {
        name: name
    });
    if (isES6Map(v)) return observable.map(v, {
        name: name
    });
    if (isES6Set(v)) return observable.set(v, {
        name: name
    });
    if (typeof v === "function" && !isAction(v) && !isFlow(v)) {
        if (isGenerator(v)) return flow(v);
        else return autoAction(name, v);
    }
    return v;
}
function shallowEnhancer(v, _, name) {
    if (v === undefined || v === null) return v;
    if (isObservableObject(v) || isObservableArray(v) || isObservableMap(v) || isObservableSet(v)) return v;
    if (Array.isArray(v)) return observable.array(v, {
        name: name,
        deep: false
    });
    if (isPlainObject(v)) return observable.object(v, undefined, {
        name: name,
        deep: false
    });
    if (isES6Map(v)) return observable.map(v, {
        name: name,
        deep: false
    });
    if (isES6Set(v)) return observable.set(v, {
        name: name,
        deep: false
    });
}
function referenceEnhancer(newValue) {
    // never turn into an observable
    return newValue;
}
function refStructEnhancer(v, oldValue) {
    if (deepEqual(v, oldValue)) return oldValue;
    return v;
}
var OVERRIDE = "override";
var override = /*#__PURE__*/ (/* unused pure expression or super */ null && (createDecoratorAnnotation({
    annotationType_: OVERRIDE,
    make_: make_,
    extend_: extend_,
    decorate_20223_: decorate_20223_
})));
function isOverride(annotation) {
    return annotation.annotationType_ === OVERRIDE;
}
function make_(adm, key) {
    return 0 /* MakeResult.Cancel */ ;
}
function extend_(adm, key, descriptor, proxyTrap) {
    die("'" + this.annotationType_ + "' can only be used with 'makeObservable'");
}
function decorate_20223_(desc, context) {
    console.warn("'" + this.annotationType_ + "' cannot be used with decorators - this is a no-op");
}
function createActionAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$1,
        extend_: extend_$1,
        decorate_20223_: decorate_20223_$1
    };
}
function make_$1(adm, key, descriptor, source) {
    var _this$options_;
    // bound
    if ((_this$options_ = this.options_) != null && _this$options_.bound) return this.extend_(adm, key, descriptor, false) === null ? 0 /* MakeResult.Cancel */  : 1 /* MakeResult.Break */ ;
    // own
    if (source === adm.target_) return this.extend_(adm, key, descriptor, false) === null ? 0 /* MakeResult.Cancel */  : 2 /* MakeResult.Continue */ ;
    // prototype
    if (isAction(descriptor.value)) // A prototype could have been annotated already by other constructor,
    // rest of the proto chain must be annotated already
    return 1 /* MakeResult.Break */ ;
    var actionDescriptor = createActionDescriptor(adm, this, key, descriptor, false);
    defineProperty(source, key, actionDescriptor);
    return 2 /* MakeResult.Continue */ ;
}
function extend_$1(adm, key, descriptor, proxyTrap) {
    var actionDescriptor = createActionDescriptor(adm, this, key, descriptor);
    return adm.defineProperty_(key, actionDescriptor, proxyTrap);
}
function decorate_20223_$1(mthd, context) {
    var kind = context.kind, name = context.name, addInitializer = context.addInitializer;
    var ann = this;
    var _createAction = function _createAction(m) {
        var _ann$options_$name, _ann$options_, _ann$options_$autoAct, _ann$options_2;
        return createAction((_ann$options_$name = (_ann$options_ = ann.options_) == null ? void 0 : _ann$options_.name) != null ? _ann$options_$name : name.toString(), m, (_ann$options_$autoAct = (_ann$options_2 = ann.options_) == null ? void 0 : _ann$options_2.autoAction) != null ? _ann$options_$autoAct : false);
    };
    if (kind == "field") return function(initMthd) {
        var _ann$options_3;
        var mthd = initMthd;
        if (!isAction(mthd)) mthd = _createAction(mthd);
        if ((_ann$options_3 = ann.options_) != null && _ann$options_3.bound) {
            mthd = mthd.bind(this);
            mthd.isMobxAction = true;
        }
        return mthd;
    };
    if (kind == "method") {
        var _this$options_2;
        if (!isAction(mthd)) mthd = _createAction(mthd);
        if ((_this$options_2 = this.options_) != null && _this$options_2.bound) addInitializer(function() {
            var self1 = this;
            var bound = self1[name].bind(self1);
            bound.isMobxAction = true;
            self1[name] = bound;
        });
        return mthd;
    }
    die("Cannot apply '" + ann.annotationType_ + "' to '" + String(name) + "' (kind: " + kind + "):" + ("\n'" + ann.annotationType_ + "' can only be used on properties with a function value."));
}
function assertActionDescriptor(adm, _ref, key, _ref2) {
    var annotationType_ = _ref.annotationType_;
    var value = _ref2.value;
}
function createActionDescriptor(adm, annotation, key, descriptor, // provides ability to disable safeDescriptors for prototypes
safeDescriptors) {
    var _annotation$options_, _annotation$options_$, _annotation$options_2, _annotation$options_$2, _annotation$options_3, _annotation$options_4, _adm$proxy_2;
    if (safeDescriptors === void 0) safeDescriptors = globalState.safeDescriptors;
    assertActionDescriptor(adm, annotation, key, descriptor);
    var value = descriptor.value;
    if ((_annotation$options_ = annotation.options_) != null && _annotation$options_.bound) {
        var _adm$proxy_;
        value = value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
    }
    return {
        value: createAction((_annotation$options_$ = (_annotation$options_2 = annotation.options_) == null ? void 0 : _annotation$options_2.name) != null ? _annotation$options_$ : key.toString(), value, (_annotation$options_$2 = (_annotation$options_3 = annotation.options_) == null ? void 0 : _annotation$options_3.autoAction) != null ? _annotation$options_$2 : false, // https://github.com/mobxjs/mobx/discussions/3140
        (_annotation$options_4 = annotation.options_) != null && _annotation$options_4.bound ? (_adm$proxy_2 = adm.proxy_) != null ? _adm$proxy_2 : adm.target_ : undefined),
        // Non-configurable for classes
        // prevents accidental field redefinition in subclass
        configurable: safeDescriptors ? adm.isPlainObject_ : true,
        // https://github.com/mobxjs/mobx/pull/2641#issuecomment-737292058
        enumerable: false,
        // Non-obsevable, therefore non-writable
        // Also prevents rewriting in subclass constructor
        writable: safeDescriptors ? false : true
    };
}
function createFlowAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$2,
        extend_: extend_$2,
        decorate_20223_: decorate_20223_$2
    };
}
function make_$2(adm, key, descriptor, source) {
    var _this$options_;
    // own
    if (source === adm.target_) return this.extend_(adm, key, descriptor, false) === null ? 0 /* MakeResult.Cancel */  : 2 /* MakeResult.Continue */ ;
    // prototype
    // bound - must annotate protos to support super.flow()
    if ((_this$options_ = this.options_) != null && _this$options_.bound && (!hasProp(adm.target_, key) || !isFlow(adm.target_[key]))) {
        if (this.extend_(adm, key, descriptor, false) === null) return 0 /* MakeResult.Cancel */ ;
    }
    if (isFlow(descriptor.value)) // A prototype could have been annotated already by other constructor,
    // rest of the proto chain must be annotated already
    return 1 /* MakeResult.Break */ ;
    var flowDescriptor = createFlowDescriptor(adm, this, key, descriptor, false, false);
    defineProperty(source, key, flowDescriptor);
    return 2 /* MakeResult.Continue */ ;
}
function extend_$2(adm, key, descriptor, proxyTrap) {
    var _this$options_2;
    var flowDescriptor = createFlowDescriptor(adm, this, key, descriptor, (_this$options_2 = this.options_) == null ? void 0 : _this$options_2.bound);
    return adm.defineProperty_(key, flowDescriptor, proxyTrap);
}
function decorate_20223_$2(mthd, context) {
    var _this$options_3;
    var name = context.name, addInitializer = context.addInitializer;
    if (!isFlow(mthd)) mthd = flow(mthd);
    if ((_this$options_3 = this.options_) != null && _this$options_3.bound) addInitializer(function() {
        var self1 = this;
        var bound = self1[name].bind(self1);
        bound.isMobXFlow = true;
        self1[name] = bound;
    });
    return mthd;
}
function assertFlowDescriptor(adm, _ref, key, _ref2) {
    var annotationType_ = _ref.annotationType_;
    var value = _ref2.value;
}
function createFlowDescriptor(adm, annotation, key, descriptor, bound, // provides ability to disable safeDescriptors for prototypes
safeDescriptors) {
    if (safeDescriptors === void 0) safeDescriptors = globalState.safeDescriptors;
    assertFlowDescriptor(adm, annotation, key, descriptor);
    var value = descriptor.value;
    // In case of flow.bound, the descriptor can be from already annotated prototype
    if (!isFlow(value)) value = flow(value);
    if (bound) {
        var _adm$proxy_;
        // We do not keep original function around, so we bind the existing flow
        value = value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
        // This is normally set by `flow`, but `bind` returns new function...
        value.isMobXFlow = true;
    }
    return {
        value: value,
        // Non-configurable for classes
        // prevents accidental field redefinition in subclass
        configurable: safeDescriptors ? adm.isPlainObject_ : true,
        // https://github.com/mobxjs/mobx/pull/2641#issuecomment-737292058
        enumerable: false,
        // Non-obsevable, therefore non-writable
        // Also prevents rewriting in subclass constructor
        writable: safeDescriptors ? false : true
    };
}
function createComputedAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$3,
        extend_: extend_$3,
        decorate_20223_: decorate_20223_$3
    };
}
function make_$3(adm, key, descriptor) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 /* MakeResult.Cancel */  : 1 /* MakeResult.Break */ ;
}
function extend_$3(adm, key, descriptor, proxyTrap) {
    assertComputedDescriptor(adm, this, key, descriptor);
    return adm.defineComputedProperty_(key, _extends({}, this.options_, {
        get: descriptor.get,
        set: descriptor.set
    }), proxyTrap);
}
function decorate_20223_$3(get, context) {
    var ann = this;
    var key = context.name, addInitializer = context.addInitializer;
    addInitializer(function() {
        var adm = asObservableObject(this)[$mobx];
        var options = _extends({}, ann.options_, {
            get: get,
            context: this
        });
        options.name || (options.name = "ObservableObject." + key.toString());
        adm.values_.set(key, new ComputedValue(options));
    });
    return function() {
        return this[$mobx].getObservablePropValue_(key);
    };
}
function assertComputedDescriptor(adm, _ref, key, _ref2) {
    var annotationType_ = _ref.annotationType_;
    var get = _ref2.get;
}
function createObservableAnnotation(name, options) {
    return {
        annotationType_: name,
        options_: options,
        make_: make_$4,
        extend_: extend_$4,
        decorate_20223_: decorate_20223_$4
    };
}
function make_$4(adm, key, descriptor) {
    return this.extend_(adm, key, descriptor, false) === null ? 0 /* MakeResult.Cancel */  : 1 /* MakeResult.Break */ ;
}
function extend_$4(adm, key, descriptor, proxyTrap) {
    var _this$options_$enhanc, _this$options_;
    assertObservableDescriptor(adm, this, key, descriptor);
    return adm.defineObservableProperty_(key, descriptor.value, (_this$options_$enhanc = (_this$options_ = this.options_) == null ? void 0 : _this$options_.enhancer) != null ? _this$options_$enhanc : deepEnhancer, proxyTrap);
}
function decorate_20223_$4(desc, context) {
    var ann = this;
    var kind = context.kind, name = context.name;
    // The laziness here is not ideal... It's a workaround to how 2022.3 Decorators are implemented:
    //   `addInitializer` callbacks are executed _before_ any accessors are defined (instead of the ideal-for-us right after each).
    //   This means that, if we were to do our stuff in an `addInitializer`, we'd attempt to read a private slot
    //   before it has been initialized. The runtime doesn't like that and throws a `Cannot read private member
    //   from an object whose class did not declare it` error.
    // TODO: it seems that this will not be required anymore in the final version of the spec
    // See TODO: link
    var initializedObjects = new WeakSet();
    function initializeObservable(target, value) {
        var _ann$options_$enhance, _ann$options_;
        var adm = asObservableObject(target)[$mobx];
        var observable = new ObservableValue(value, (_ann$options_$enhance = (_ann$options_ = ann.options_) == null ? void 0 : _ann$options_.enhancer) != null ? _ann$options_$enhance : deepEnhancer, "ObservableObject." + name.toString(), false);
        adm.values_.set(name, observable);
        initializedObjects.add(target);
    }
    if (kind == "accessor") return {
        get: function get() {
            if (!initializedObjects.has(this)) initializeObservable(this, desc.get.call(this));
            return this[$mobx].getObservablePropValue_(name);
        },
        set: function set(value) {
            if (!initializedObjects.has(this)) initializeObservable(this, value);
            return this[$mobx].setObservablePropValue_(name, value);
        },
        init: function init(value) {
            if (!initializedObjects.has(this)) initializeObservable(this, value);
            return value;
        }
    };
    return;
}
function assertObservableDescriptor(adm, _ref, key, descriptor) {
    var annotationType_ = _ref.annotationType_;
}
var AUTO = "true";
var autoAnnotation = /*#__PURE__*/ createAutoAnnotation();
function createAutoAnnotation(options) {
    return {
        annotationType_: AUTO,
        options_: options,
        make_: make_$5,
        extend_: extend_$5,
        decorate_20223_: decorate_20223_$5
    };
}
function make_$5(adm, key, descriptor, source) {
    var _this$options_3, _this$options_4;
    // getter -> computed
    if (descriptor.get) return computed.make_(adm, key, descriptor, source);
    // lone setter -> action setter
    if (descriptor.set) {
        // TODO make action applicable to setter and delegate to action.make_
        var set = createAction(key.toString(), descriptor.set);
        // own
        if (source === adm.target_) return adm.defineProperty_(key, {
            configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
            set: set
        }) === null ? 0 /* MakeResult.Cancel */  : 2 /* MakeResult.Continue */ ;
        // proto
        defineProperty(source, key, {
            configurable: true,
            set: set
        });
        return 2 /* MakeResult.Continue */ ;
    }
    // function on proto -> autoAction/flow
    if (source !== adm.target_ && typeof descriptor.value === "function") {
        var _this$options_2;
        if (isGenerator(descriptor.value)) {
            var _this$options_;
            var flowAnnotation = (_this$options_ = this.options_) != null && _this$options_.autoBind ? flow.bound : flow;
            return flowAnnotation.make_(adm, key, descriptor, source);
        }
        var actionAnnotation = (_this$options_2 = this.options_) != null && _this$options_2.autoBind ? autoAction.bound : autoAction;
        return actionAnnotation.make_(adm, key, descriptor, source);
    }
    // other -> observable
    // Copy props from proto as well, see test:
    // "decorate should work with Object.create"
    var observableAnnotation = ((_this$options_3 = this.options_) == null ? void 0 : _this$options_3.deep) === false ? observable.ref : observable;
    // if function respect autoBind option
    if (typeof descriptor.value === "function" && (_this$options_4 = this.options_) != null && _this$options_4.autoBind) {
        var _adm$proxy_;
        descriptor.value = descriptor.value.bind((_adm$proxy_ = adm.proxy_) != null ? _adm$proxy_ : adm.target_);
    }
    return observableAnnotation.make_(adm, key, descriptor, source);
}
function extend_$5(adm, key, descriptor, proxyTrap) {
    var _this$options_5, _this$options_6;
    // getter -> computed
    if (descriptor.get) return computed.extend_(adm, key, descriptor, proxyTrap);
    // lone setter -> action setter
    if (descriptor.set) // TODO make action applicable to setter and delegate to action.extend_
    return adm.defineProperty_(key, {
        configurable: globalState.safeDescriptors ? adm.isPlainObject_ : true,
        set: createAction(key.toString(), descriptor.set)
    }, proxyTrap);
    // other -> observable
    // if function respect autoBind option
    if (typeof descriptor.value === "function" && (_this$options_5 = this.options_) != null && _this$options_5.autoBind) {
        var _adm$proxy_2;
        descriptor.value = descriptor.value.bind((_adm$proxy_2 = adm.proxy_) != null ? _adm$proxy_2 : adm.target_);
    }
    var observableAnnotation = ((_this$options_6 = this.options_) == null ? void 0 : _this$options_6.deep) === false ? observable.ref : observable;
    return observableAnnotation.extend_(adm, key, descriptor, proxyTrap);
}
function decorate_20223_$5(desc, context) {
    die("'" + this.annotationType_ + "' cannot be used as a decorator");
}
var OBSERVABLE = "observable";
var OBSERVABLE_REF = "observable.ref";
var OBSERVABLE_SHALLOW = "observable.shallow";
var OBSERVABLE_STRUCT = "observable.struct";
// Predefined bags of create observable options, to avoid allocating temporarily option objects
// in the majority of cases
var defaultCreateObservableOptions = {
    deep: true,
    name: undefined,
    defaultDecorator: undefined,
    proxy: true
};
Object.freeze(defaultCreateObservableOptions);
function asCreateObservableOptions(thing) {
    return thing || defaultCreateObservableOptions;
}
var observableAnnotation = /*#__PURE__*/ createObservableAnnotation(OBSERVABLE);
var observableRefAnnotation = /*#__PURE__*/ createObservableAnnotation(OBSERVABLE_REF, {
    enhancer: referenceEnhancer
});
var observableShallowAnnotation = /*#__PURE__*/ createObservableAnnotation(OBSERVABLE_SHALLOW, {
    enhancer: shallowEnhancer
});
var observableStructAnnotation = /*#__PURE__*/ createObservableAnnotation(OBSERVABLE_STRUCT, {
    enhancer: refStructEnhancer
});
var observableDecoratorAnnotation = /*#__PURE__*/ createDecoratorAnnotation(observableAnnotation);
function getEnhancerFromOptions(options) {
    return options.deep === true ? deepEnhancer : options.deep === false ? referenceEnhancer : getEnhancerFromAnnotation(options.defaultDecorator);
}
function getAnnotationFromOptions(options) {
    var _options$defaultDecor;
    return options ? (_options$defaultDecor = options.defaultDecorator) != null ? _options$defaultDecor : createAutoAnnotation(options) : undefined;
}
function getEnhancerFromAnnotation(annotation) {
    var _annotation$options_$, _annotation$options_;
    return !annotation ? deepEnhancer : (_annotation$options_$ = (_annotation$options_ = annotation.options_) == null ? void 0 : _annotation$options_.enhancer) != null ? _annotation$options_$ : deepEnhancer;
}
/**
 * Turns an object, array or function into a reactive structure.
 * @param v the value which should become observable.
 */ function createObservable(v, arg2, arg3) {
    // @observable someProp; (2022.3 Decorators)
    if (is20223Decorator(arg2)) return observableAnnotation.decorate_20223_(v, arg2);
    // @observable someProp;
    if (isStringish(arg2)) {
        storeAnnotation(v, arg2, observableAnnotation);
        return;
    }
    // already observable - ignore
    if (isObservable(v)) return v;
    // plain object
    if (isPlainObject(v)) return observable.object(v, arg2, arg3);
    // Array
    if (Array.isArray(v)) return observable.array(v, arg2);
    // Map
    if (isES6Map(v)) return observable.map(v, arg2);
    // Set
    if (isES6Set(v)) return observable.set(v, arg2);
    // other object - ignore
    if (typeof v === "object" && v !== null) return v;
    // anything else
    return observable.box(v, arg2);
}
assign(createObservable, observableDecoratorAnnotation);
var observableFactories = {
    box: function box(value, options) {
        var o = asCreateObservableOptions(options);
        return new ObservableValue(value, getEnhancerFromOptions(o), o.name, true, o.equals);
    },
    array: function array(initialValues, options) {
        var o = asCreateObservableOptions(options);
        return (globalState.useProxies === false || o.proxy === false ? createLegacyArray : createObservableArray)(initialValues, getEnhancerFromOptions(o), o.name);
    },
    map: function map(initialValues, options) {
        var o = asCreateObservableOptions(options);
        return new ObservableMap(initialValues, getEnhancerFromOptions(o), o.name);
    },
    set: function set(initialValues, options) {
        var o = asCreateObservableOptions(options);
        return new ObservableSet(initialValues, getEnhancerFromOptions(o), o.name);
    },
    object: function object(props, decorators, options) {
        return initObservable(function() {
            return extendObservable(globalState.useProxies === false || (options == null ? void 0 : options.proxy) === false ? asObservableObject({}, options) : asDynamicObservableObject({}, options), props, decorators);
        });
    },
    ref: /*#__PURE__*/ createDecoratorAnnotation(observableRefAnnotation),
    shallow: /*#__PURE__*/ createDecoratorAnnotation(observableShallowAnnotation),
    deep: observableDecoratorAnnotation,
    struct: /*#__PURE__*/ createDecoratorAnnotation(observableStructAnnotation)
};
// eslint-disable-next-line
var observable = /*#__PURE__*/ assign(createObservable, observableFactories);
var COMPUTED = "computed";
var COMPUTED_STRUCT = "computed.struct";
var computedAnnotation = /*#__PURE__*/ createComputedAnnotation(COMPUTED);
var computedStructAnnotation = /*#__PURE__*/ createComputedAnnotation(COMPUTED_STRUCT, {
    equals: comparer.structural
});
/**
 * Decorator for class properties: @computed get value() { return expr; }.
 * For legacy purposes also invokable as ES5 observable created: `computed(() => expr)`;
 */ var computed = function computed(arg1, arg2) {
    if (is20223Decorator(arg2)) // @computed (2022.3 Decorators)
    return computedAnnotation.decorate_20223_(arg1, arg2);
    if (isStringish(arg2)) // @computed
    return storeAnnotation(arg1, arg2, computedAnnotation);
    if (isPlainObject(arg1)) // @computed({ options })
    return createDecoratorAnnotation(createComputedAnnotation(COMPUTED, arg1));
    var opts = isPlainObject(arg2) ? arg2 : {};
    opts.get = arg1;
    opts.name || (opts.name = arg1.name || ""); /* for generated name */ 
    return new ComputedValue(opts);
};
Object.assign(computed, computedAnnotation);
computed.struct = /*#__PURE__*/ createDecoratorAnnotation(computedStructAnnotation);
var _getDescriptor$config, _getDescriptor;
// we don't use globalState for these in order to avoid possible issues with multiple
// mobx versions
var currentActionId = 0;
var nextActionId = 1;
var isFunctionNameConfigurable = (_getDescriptor$config = (_getDescriptor = /*#__PURE__*/ getDescriptor(function() {}, "name")) == null ? void 0 : _getDescriptor.configurable) != null ? _getDescriptor$config : false;
// we can safely recycle this object
var tmpNameDescriptor = {
    value: "action",
    configurable: true,
    writable: false,
    enumerable: false
};
function createAction(actionName, fn, autoAction, ref) {
    if (autoAction === void 0) autoAction = false;
    function res() {
        return executeAction(actionName, autoAction, fn, ref || this, arguments);
    }
    res.isMobxAction = true;
    res.toString = function() {
        return fn.toString();
    };
    if (isFunctionNameConfigurable) {
        tmpNameDescriptor.value = actionName;
        defineProperty(res, "name", tmpNameDescriptor);
    }
    return res;
}
function executeAction(actionName, canRunAsDerivation, fn, scope, args) {
    var runInfo = _startAction(actionName, canRunAsDerivation, scope, args);
    try {
        return fn.apply(scope, args);
    } catch (err) {
        runInfo.error_ = err;
        throw err;
    } finally{
        _endAction(runInfo);
    }
}
function _startAction(actionName, canRunAsDerivation, // true for autoAction
scope, args) {
    var notifySpy_ = false;
    var startTime_ = 0;
    var flattenedArgs;
    var prevDerivation_ = globalState.trackingDerivation;
    var runAsAction = !canRunAsDerivation || !prevDerivation_;
    startBatch();
    var prevAllowStateChanges_ = globalState.allowStateChanges; // by default preserve previous allow
    if (runAsAction) {
        untrackedStart();
        prevAllowStateChanges_ = allowStateChangesStart(true);
    }
    var prevAllowStateReads_ = allowStateReadsStart(true);
    var runInfo = {
        runAsAction_: runAsAction,
        prevDerivation_: prevDerivation_,
        prevAllowStateChanges_: prevAllowStateChanges_,
        prevAllowStateReads_: prevAllowStateReads_,
        notifySpy_: notifySpy_,
        startTime_: startTime_,
        actionId_: nextActionId++,
        parentActionId_: currentActionId
    };
    currentActionId = runInfo.actionId_;
    return runInfo;
}
function _endAction(runInfo) {
    if (currentActionId !== runInfo.actionId_) die(30);
    currentActionId = runInfo.parentActionId_;
    if (runInfo.error_ !== undefined) globalState.suppressReactionErrors = true;
    allowStateChangesEnd(runInfo.prevAllowStateChanges_);
    allowStateReadsEnd(runInfo.prevAllowStateReads_);
    endBatch();
    if (runInfo.runAsAction_) untrackedEnd(runInfo.prevDerivation_);
    globalState.suppressReactionErrors = false;
}
function allowStateChanges(allowStateChanges, func) {
    var prev = allowStateChangesStart(allowStateChanges);
    try {
        return func();
    } finally{
        allowStateChangesEnd(prev);
    }
}
function allowStateChangesStart(allowStateChanges) {
    var prev = globalState.allowStateChanges;
    globalState.allowStateChanges = allowStateChanges;
    return prev;
}
function allowStateChangesEnd(prev) {
    globalState.allowStateChanges = prev;
}
var CREATE = "create";
var ObservableValue = /*#__PURE__*/ function(_Atom) {
    function ObservableValue(value, enhancer, name_, notifySpy, equals) {
        var _this;
        if (name_ === void 0) name_ = "ObservableValue";
        if (notifySpy === void 0) notifySpy = true;
        if (equals === void 0) equals = comparer["default"];
        _this = _Atom.call(this, name_) || this;
        _this.enhancer = void 0;
        _this.name_ = void 0;
        _this.equals = void 0;
        _this.hasUnreportedChange_ = false;
        _this.interceptors_ = void 0;
        _this.changeListeners_ = void 0;
        _this.value_ = void 0;
        _this.dehancer = void 0;
        _this.enhancer = enhancer;
        _this.name_ = name_;
        _this.equals = equals;
        _this.value_ = enhancer(value, undefined, name_);
        return _this;
    }
    _inheritsLoose(ObservableValue, _Atom);
    var _proto = ObservableValue.prototype;
    _proto.dehanceValue = function dehanceValue(value) {
        if (this.dehancer !== undefined) return this.dehancer(value);
        return value;
    };
    _proto.set = function set(newValue) {
        var oldValue = this.value_;
        newValue = this.prepareNewValue_(newValue);
        if (newValue !== globalState.UNCHANGED) {
            var notifySpy = isSpyEnabled();
            this.setNewValue_(newValue);
        }
    };
    _proto.prepareNewValue_ = function prepareNewValue_(newValue) {
        checkIfStateModificationsAreAllowed(this);
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                object: this,
                type: UPDATE,
                newValue: newValue
            });
            if (!change) return globalState.UNCHANGED;
            newValue = change.newValue;
        }
        // apply modifier
        newValue = this.enhancer(newValue, this.value_, this.name_);
        return this.equals(this.value_, newValue) ? globalState.UNCHANGED : newValue;
    };
    _proto.setNewValue_ = function setNewValue_(newValue) {
        var oldValue = this.value_;
        this.value_ = newValue;
        this.reportChanged();
        if (hasListeners(this)) notifyListeners(this, {
            type: UPDATE,
            object: this,
            newValue: newValue,
            oldValue: oldValue
        });
    };
    _proto.get = function get() {
        this.reportObserved();
        return this.dehanceValue(this.value_);
    };
    _proto.intercept_ = function intercept_(handler) {
        return registerInterceptor(this, handler);
    };
    _proto.observe_ = function observe_(listener, fireImmediately) {
        if (fireImmediately) listener({
            observableKind: "value",
            debugObjectName: this.name_,
            object: this,
            type: UPDATE,
            newValue: this.value_,
            oldValue: undefined
        });
        return registerListener(this, listener);
    };
    _proto.raw = function raw() {
        // used by MST ot get undehanced value
        return this.value_;
    };
    _proto.toJSON = function toJSON() {
        return this.get();
    };
    _proto.toString = function toString() {
        return this.name_ + "[" + this.value_ + "]";
    };
    _proto.valueOf = function valueOf() {
        return toPrimitive(this.get());
    };
    _proto[Symbol.toPrimitive] = function() {
        return this.valueOf();
    };
    return ObservableValue;
}(Atom);
var isObservableValue = /*#__PURE__*/ (/* unused pure expression or super */ null && (createInstanceofPredicate("ObservableValue", ObservableValue)));
/**
 * A node in the state dependency root that observes other nodes, and can be observed itself.
 *
 * ComputedValue will remember the result of the computation for the duration of the batch, or
 * while being observed.
 *
 * During this time it will recompute only when one of its direct dependencies changed,
 * but only when it is being accessed with `ComputedValue.get()`.
 *
 * Implementation description:
 * 1. First time it's being accessed it will compute and remember result
 *    give back remembered result until 2. happens
 * 2. First time any deep dependency change, propagate POSSIBLY_STALE to all observers, wait for 3.
 * 3. When it's being accessed, recompute if any shallow dependency changed.
 *    if result changed: propagate STALE to all observers, that were POSSIBLY_STALE from the last step.
 *    go to step 2. either way
 *
 * If at any point it's outside batch and it isn't observed: reset everything and go to 1.
 */ var ComputedValue = /*#__PURE__*/ function() {
    /**
   * Create a new computed value based on a function expression.
   *
   * The `name` property is for debug purposes only.
   *
   * The `equals` property specifies the comparer function to use to determine if a newly produced
   * value differs from the previous value. Two comparers are provided in the library; `defaultComparer`
   * compares based on identity comparison (===), and `structuralComparer` deeply compares the structure.
   * Structural comparison can be convenient if you always produce a new aggregated object and
   * don't want to notify observers if it is structurally the same.
   * This is useful for working with vectors, mouse coordinates etc.
   */ function ComputedValue(options) {
        this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
        this.observing_ = [];
        // nodes we are looking at. Our value depends on these nodes
        this.newObserving_ = null;
        // during tracking it's an array with new observed observers
        this.observers_ = new Set();
        this.runId_ = 0;
        this.lastAccessedBy_ = 0;
        this.lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
        this.unboundDepsCount_ = 0;
        this.value_ = new CaughtException(null);
        this.name_ = void 0;
        this.triggeredBy_ = void 0;
        this.flags_ = 0;
        this.derivation = void 0;
        // N.B: unminified as it is used by MST
        this.setter_ = void 0;
        this.isTracing_ = TraceMode.NONE;
        this.scope_ = void 0;
        this.equals_ = void 0;
        this.requiresReaction_ = void 0;
        this.keepAlive_ = void 0;
        this.onBOL = void 0;
        this.onBUOL = void 0;
        if (!options.get) die(31);
        this.derivation = options.get;
        this.name_ = options.name || "ComputedValue";
        if (options.set) this.setter_ = createAction("ComputedValue-setter", options.set);
        this.equals_ = options.equals || (options.compareStructural || options.struct ? comparer.structural : comparer["default"]);
        this.scope_ = options.context;
        this.requiresReaction_ = options.requiresReaction;
        this.keepAlive_ = !!options.keepAlive;
    }
    var _proto = ComputedValue.prototype;
    _proto.onBecomeStale_ = function onBecomeStale_() {
        propagateMaybeChanged(this);
    };
    _proto.onBO = function onBO() {
        if (this.onBOL) this.onBOL.forEach(function(listener) {
            return listener();
        });
    };
    _proto.onBUO = function onBUO() {
        if (this.onBUOL) this.onBUOL.forEach(function(listener) {
            return listener();
        });
    };
    /**
   * Returns the current value of this computed value.
   * Will evaluate its computation first if needed.
   */ _proto.get = function get() {
        if (this.isComputing) die(32, this.name_, this.derivation);
        if (globalState.inBatch === 0 && // !globalState.trackingDerivatpion &&
        this.observers_.size === 0 && !this.keepAlive_) {
            if (shouldCompute(this)) {
                this.warnAboutUntrackedRead_();
                startBatch(); // See perf test 'computed memoization'
                this.value_ = this.computeValue_(false);
                endBatch();
            }
        } else {
            reportObserved(this);
            if (shouldCompute(this)) {
                var prevTrackingContext = globalState.trackingContext;
                if (this.keepAlive_ && !prevTrackingContext) globalState.trackingContext = this;
                if (this.trackAndCompute()) propagateChangeConfirmed(this);
                globalState.trackingContext = prevTrackingContext;
            }
        }
        var result = this.value_;
        if (isCaughtException(result)) throw result.cause;
        return result;
    };
    _proto.set = function set(value) {
        if (this.setter_) {
            if (this.isRunningSetter) die(33, this.name_);
            this.isRunningSetter = true;
            try {
                this.setter_.call(this.scope_, value);
            } finally{
                this.isRunningSetter = false;
            }
        } else die(34, this.name_);
    };
    _proto.trackAndCompute = function trackAndCompute() {
        // N.B: unminified as it is used by MST
        var oldValue = this.value_;
        var wasSuspended = /* see #1208 */ this.dependenciesState_ === IDerivationState_.NOT_TRACKING_;
        var newValue = this.computeValue_(true);
        var changed = wasSuspended || isCaughtException(oldValue) || isCaughtException(newValue) || !this.equals_(oldValue, newValue);
        if (changed) this.value_ = newValue;
        return changed;
    };
    _proto.computeValue_ = function computeValue_(track) {
        this.isComputing = true;
        // don't allow state changes during computation
        var prev = allowStateChangesStart(false);
        var res;
        if (track) res = trackDerivedFunction(this, this.derivation, this.scope_);
        else {
            if (globalState.disableErrorBoundaries === true) res = this.derivation.call(this.scope_);
            else try {
                res = this.derivation.call(this.scope_);
            } catch (e) {
                res = new CaughtException(e);
            }
        }
        allowStateChangesEnd(prev);
        this.isComputing = false;
        return res;
    };
    _proto.suspend_ = function suspend_() {
        if (!this.keepAlive_) {
            clearObserving(this);
            this.value_ = undefined; // don't hold on to computed value!
        }
    };
    _proto.observe_ = function observe_(listener, fireImmediately) {
        var _this = this;
        var firstTime = true;
        var prevValue = undefined;
        return autorun(function() {
            // TODO: why is this in a different place than the spyReport() function? in all other observables it's called in the same place
            var newValue = _this.get();
            if (!firstTime || fireImmediately) {
                var prevU = untrackedStart();
                listener({
                    observableKind: "computed",
                    debugObjectName: _this.name_,
                    type: UPDATE,
                    object: _this,
                    newValue: newValue,
                    oldValue: prevValue
                });
                untrackedEnd(prevU);
            }
            firstTime = false;
            prevValue = newValue;
        });
    };
    _proto.warnAboutUntrackedRead_ = function warnAboutUntrackedRead_() {
        return;
    };
    _proto.toString = function toString() {
        return this.name_ + "[" + this.derivation.toString() + "]";
    };
    _proto.valueOf = function valueOf() {
        return toPrimitive(this.get());
    };
    _proto[Symbol.toPrimitive] = function() {
        return this.valueOf();
    };
    return _createClass(ComputedValue, [
        {
            key: "isComputing",
            get: function get() {
                return getFlag(this.flags_, ComputedValue.isComputingMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, ComputedValue.isComputingMask_, newValue);
            }
        },
        {
            key: "isRunningSetter",
            get: function get() {
                return getFlag(this.flags_, ComputedValue.isRunningSetterMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, ComputedValue.isRunningSetterMask_, newValue);
            }
        },
        {
            key: "isBeingObserved",
            get: function get() {
                return getFlag(this.flags_, ComputedValue.isBeingObservedMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, ComputedValue.isBeingObservedMask_, newValue);
            }
        },
        {
            key: "isPendingUnobservation",
            get: function get() {
                return getFlag(this.flags_, ComputedValue.isPendingUnobservationMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, ComputedValue.isPendingUnobservationMask_, newValue);
            }
        },
        {
            key: "diffValue",
            get: function get() {
                return getFlag(this.flags_, ComputedValue.diffValueMask_) ? 1 : 0;
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, ComputedValue.diffValueMask_, newValue === 1 ? true : false);
            }
        }
    ]);
}();
ComputedValue.isComputingMask_ = 1;
ComputedValue.isRunningSetterMask_ = 2;
ComputedValue.isBeingObservedMask_ = 4;
ComputedValue.isPendingUnobservationMask_ = 8;
ComputedValue.diffValueMask_ = 16;
var isComputedValue = /*#__PURE__*/ createInstanceofPredicate("ComputedValue", ComputedValue);
var IDerivationState_;
(function(IDerivationState_) {
    // before being run or (outside batch and not being observed)
    // at this point derivation is not holding any data about dependency tree
    IDerivationState_[IDerivationState_["NOT_TRACKING_"] = -1] = "NOT_TRACKING_";
    // no shallow dependency changed since last computation
    // won't recalculate derivation
    // this is what makes mobx fast
    IDerivationState_[IDerivationState_["UP_TO_DATE_"] = 0] = "UP_TO_DATE_";
    // some deep dependency changed, but don't know if shallow dependency changed
    // will require to check first if UP_TO_DATE or POSSIBLY_STALE
    // currently only ComputedValue will propagate POSSIBLY_STALE
    //
    // having this state is second big optimization:
    // don't have to recompute on every dependency change, but only when it's needed
    IDerivationState_[IDerivationState_["POSSIBLY_STALE_"] = 1] = "POSSIBLY_STALE_";
    // A shallow dependency has changed since last computation and the derivation
    // will need to recompute when it's needed next.
    IDerivationState_[IDerivationState_["STALE_"] = 2] = "STALE_";
})(IDerivationState_ || (IDerivationState_ = {}));
var TraceMode;
(function(TraceMode) {
    TraceMode[TraceMode["NONE"] = 0] = "NONE";
    TraceMode[TraceMode["LOG"] = 1] = "LOG";
    TraceMode[TraceMode["BREAK"] = 2] = "BREAK";
})(TraceMode || (TraceMode = {}));
var CaughtException = function CaughtException(cause) {
    this.cause = void 0;
    this.cause = cause;
// Empty
};
function isCaughtException(e) {
    return e instanceof CaughtException;
}
/**
 * Finds out whether any dependency of the derivation has actually changed.
 * If dependenciesState is 1 then it will recalculate dependencies,
 * if any dependency changed it will propagate it by changing dependenciesState to 2.
 *
 * By iterating over the dependencies in the same order that they were reported and
 * stopping on the first change, all the recalculations are only called for ComputedValues
 * that will be tracked by derivation. That is because we assume that if the first x
 * dependencies of the derivation doesn't change then the derivation should run the same way
 * up until accessing x-th dependency.
 */ function shouldCompute(derivation) {
    switch(derivation.dependenciesState_){
        case IDerivationState_.UP_TO_DATE_:
            return false;
        case IDerivationState_.NOT_TRACKING_:
        case IDerivationState_.STALE_:
            return true;
        case IDerivationState_.POSSIBLY_STALE_:
            // state propagation can occur outside of action/reactive context #2195
            var prevAllowStateReads = allowStateReadsStart(true);
            var prevUntracked = untrackedStart(); // no need for those computeds to be reported, they will be picked up in trackDerivedFunction.
            var obs = derivation.observing_, l = obs.length;
            for(var i = 0; i < l; i++){
                var obj = obs[i];
                if (isComputedValue(obj)) {
                    if (globalState.disableErrorBoundaries) obj.get();
                    else try {
                        obj.get();
                    } catch (e) {
                        // we are not interested in the value *or* exception at this moment, but if there is one, notify all
                        untrackedEnd(prevUntracked);
                        allowStateReadsEnd(prevAllowStateReads);
                        return true;
                    }
                    // if ComputedValue `obj` actually changed it will be computed and propagated to its observers.
                    // and `derivation` is an observer of `obj`
                    // invariantShouldCompute(derivation)
                    if (derivation.dependenciesState_ === IDerivationState_.STALE_) {
                        untrackedEnd(prevUntracked);
                        allowStateReadsEnd(prevAllowStateReads);
                        return true;
                    }
                }
            }
            changeDependenciesStateTo0(derivation);
            untrackedEnd(prevUntracked);
            allowStateReadsEnd(prevAllowStateReads);
            return false;
    }
}
function isComputingDerivation() {
    return globalState.trackingDerivation !== null; // filter out actions inside computations
}
function checkIfStateModificationsAreAllowed(atom) {
    var hasObservers;
    return;
}
function checkIfStateReadsAreAllowed(observable) {}
/**
 * Executes the provided function `f` and tracks which observables are being accessed.
 * The tracking information is stored on the `derivation` object and the derivation is registered
 * as observer of any of the accessed observables.
 */ function trackDerivedFunction(derivation, f, context) {
    var prevAllowStateReads = allowStateReadsStart(true);
    changeDependenciesStateTo0(derivation);
    // Preallocate array; will be trimmed by bindDependencies.
    derivation.newObserving_ = new Array(// Reserve constant space for initial dependencies, dynamic space otherwise.
    // See https://github.com/mobxjs/mobx/pull/3833
    derivation.runId_ === 0 ? 100 : derivation.observing_.length);
    derivation.unboundDepsCount_ = 0;
    derivation.runId_ = ++globalState.runId;
    var prevTracking = globalState.trackingDerivation;
    globalState.trackingDerivation = derivation;
    globalState.inBatch++;
    var result;
    if (globalState.disableErrorBoundaries === true) result = f.call(context);
    else try {
        result = f.call(context);
    } catch (e) {
        result = new CaughtException(e);
    }
    globalState.inBatch--;
    globalState.trackingDerivation = prevTracking;
    bindDependencies(derivation);
    warnAboutDerivationWithoutDependencies(derivation);
    allowStateReadsEnd(prevAllowStateReads);
    return result;
}
function warnAboutDerivationWithoutDependencies(derivation) {
    return;
}
/**
 * diffs newObserving with observing.
 * update observing to be newObserving with unique observables
 * notify observers that become observed/unobserved
 */ function bindDependencies(derivation) {
    // invariant(derivation.dependenciesState !== IDerivationState.NOT_TRACKING, "INTERNAL ERROR bindDependencies expects derivation.dependenciesState !== -1");
    var prevObserving = derivation.observing_;
    var observing = derivation.observing_ = derivation.newObserving_;
    var lowestNewObservingDerivationState = IDerivationState_.UP_TO_DATE_;
    // Go through all new observables and check diffValue: (this list can contain duplicates):
    //   0: first occurrence, change to 1 and keep it
    //   1: extra occurrence, drop it
    var i0 = 0, l = derivation.unboundDepsCount_;
    for(var i = 0; i < l; i++){
        var dep = observing[i];
        if (dep.diffValue === 0) {
            dep.diffValue = 1;
            if (i0 !== i) observing[i0] = dep;
            i0++;
        }
        // Upcast is 'safe' here, because if dep is IObservable, `dependenciesState` will be undefined,
        // not hitting the condition
        if (dep.dependenciesState_ > lowestNewObservingDerivationState) lowestNewObservingDerivationState = dep.dependenciesState_;
    }
    observing.length = i0;
    derivation.newObserving_ = null; // newObserving shouldn't be needed outside tracking (statement moved down to work around FF bug, see #614)
    // Go through all old observables and check diffValue: (it is unique after last bindDependencies)
    //   0: it's not in new observables, unobserve it
    //   1: it keeps being observed, don't want to notify it. change to 0
    l = prevObserving.length;
    while(l--){
        var _dep = prevObserving[l];
        if (_dep.diffValue === 0) removeObserver(_dep, derivation);
        _dep.diffValue = 0;
    }
    // Go through all new observables and check diffValue: (now it should be unique)
    //   0: it was set to 0 in last loop. don't need to do anything.
    //   1: it wasn't observed, let's observe it. set back to 0
    while(i0--){
        var _dep2 = observing[i0];
        if (_dep2.diffValue === 1) {
            _dep2.diffValue = 0;
            addObserver(_dep2, derivation);
        }
    }
    // Some new observed derivations may become stale during this derivation computation
    // so they have had no chance to propagate staleness (#916)
    if (lowestNewObservingDerivationState !== IDerivationState_.UP_TO_DATE_) {
        derivation.dependenciesState_ = lowestNewObservingDerivationState;
        derivation.onBecomeStale_();
    }
}
function clearObserving(derivation) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR clearObserving should be called only inside batch");
    var obs = derivation.observing_;
    derivation.observing_ = [];
    var i = obs.length;
    while(i--)removeObserver(obs[i], derivation);
    derivation.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
}
function untracked(action) {
    var prev = untrackedStart();
    try {
        return action();
    } finally{
        untrackedEnd(prev);
    }
}
function untrackedStart() {
    var prev = globalState.trackingDerivation;
    globalState.trackingDerivation = null;
    return prev;
}
function untrackedEnd(prev) {
    globalState.trackingDerivation = prev;
}
function allowStateReadsStart(allowStateReads) {
    var prev = globalState.allowStateReads;
    globalState.allowStateReads = allowStateReads;
    return prev;
}
function allowStateReadsEnd(prev) {
    globalState.allowStateReads = prev;
}
/**
 * needed to keep `lowestObserverState` correct. when changing from (2 or 1) to 0
 *
 */ function changeDependenciesStateTo0(derivation) {
    if (derivation.dependenciesState_ === IDerivationState_.UP_TO_DATE_) return;
    derivation.dependenciesState_ = IDerivationState_.UP_TO_DATE_;
    var obs = derivation.observing_;
    var i = obs.length;
    while(i--)obs[i].lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
}
/**
 * These values will persist if global state is reset
 */ var persistentKeys = (/* unused pure expression or super */ null && ([
    "mobxGuid",
    "spyListeners",
    "enforceActions",
    "computedRequiresReaction",
    "reactionRequiresObservable",
    "observableRequiresReaction",
    "allowStateReads",
    "disableErrorBoundaries",
    "runId",
    "UNCHANGED",
    "useProxies"
]));
var MobXGlobals = function MobXGlobals() {
    /**
   * MobXGlobals version.
   * MobX compatiblity with other versions loaded in memory as long as this version matches.
   * It indicates that the global state still stores similar information
   *
   * N.B: this version is unrelated to the package version of MobX, and is only the version of the
   * internal state storage of MobX, and can be the same across many different package versions
   */ this.version = 6;
    /**
   * globally unique token to signal unchanged
   */ this.UNCHANGED = {};
    /**
   * Currently running derivation
   */ this.trackingDerivation = null;
    /**
   * Currently running reaction. This determines if we currently have a reactive context.
   * (Tracking derivation is also set for temporal tracking of computed values inside actions,
   * but trackingReaction can only be set by a form of Reaction)
   */ this.trackingContext = null;
    /**
   * Each time a derivation is tracked, it is assigned a unique run-id
   */ this.runId = 0;
    /**
   * 'guid' for general purpose. Will be persisted amongst resets.
   */ this.mobxGuid = 0;
    /**
   * Are we in a batch block? (and how many of them)
   */ this.inBatch = 0;
    /**
   * Observables that don't have observers anymore, and are about to be
   * suspended, unless somebody else accesses it in the same batch
   *
   * @type {IObservable[]}
   */ this.pendingUnobservations = [];
    /**
   * List of scheduled, not yet executed, reactions.
   */ this.pendingReactions = [];
    /**
   * Are we currently processing reactions?
   */ this.isRunningReactions = false;
    /**
   * Is it allowed to change observables at this point?
   * In general, MobX doesn't allow that when running computations and React.render.
   * To ensure that those functions stay pure.
   */ this.allowStateChanges = false;
    /**
   * Is it allowed to read observables at this point?
   * Used to hold the state needed for `observableRequiresReaction`
   */ this.allowStateReads = true;
    /**
   * If strict mode is enabled, state changes are by default not allowed
   */ this.enforceActions = true;
    /**
   * Spy callbacks
   */ this.spyListeners = [];
    /**
   * Globally attached error handlers that react specifically to errors in reactions
   */ this.globalReactionErrorHandlers = [];
    /**
   * Warn if computed values are accessed outside a reactive context
   */ this.computedRequiresReaction = false;
    /**
   * (Experimental)
   * Warn if you try to create to derivation / reactive context without accessing any observable.
   */ this.reactionRequiresObservable = false;
    /**
   * (Experimental)
   * Warn if observables are accessed outside a reactive context
   */ this.observableRequiresReaction = false;
    /*
   * Don't catch and rethrow exceptions. This is useful for inspecting the state of
   * the stack when an exception occurs while debugging.
   */ this.disableErrorBoundaries = false;
    /*
   * If true, we are already handling an exception in an action. Any errors in reactions should be suppressed, as
   * they are not the cause, see: https://github.com/mobxjs/mobx/issues/1836
   */ this.suppressReactionErrors = false;
    this.useProxies = true;
    /*
   * print warnings about code that would fail if proxies weren't available
   */ this.verifyProxies = false;
    /**
   * False forces all object's descriptors to
   * writable: true
   * configurable: true
   */ this.safeDescriptors = true;
};
var canMergeGlobalState = true;
var isolateCalled = false;
var globalState = /*#__PURE__*/ function() {
    var global1 = /*#__PURE__*/ getGlobal();
    if (global1.__mobxInstanceCount > 0 && !global1.__mobxGlobals) canMergeGlobalState = false;
    if (global1.__mobxGlobals && global1.__mobxGlobals.version !== new MobXGlobals().version) canMergeGlobalState = false;
    if (!canMergeGlobalState) {
        // Because this is a IIFE we need to let isolateCalled a chance to change
        // so we run it after the event loop completed at least 1 iteration
        setTimeout(function() {
            if (!isolateCalled) die(35);
        }, 1);
        return new MobXGlobals();
    } else if (global1.__mobxGlobals) {
        global1.__mobxInstanceCount += 1;
        if (!global1.__mobxGlobals.UNCHANGED) global1.__mobxGlobals.UNCHANGED = {};
         // make merge backward compatible
        return global1.__mobxGlobals;
    } else {
        global1.__mobxInstanceCount = 1;
        return global1.__mobxGlobals = /*#__PURE__*/ new MobXGlobals();
    }
}();
function isolateGlobalState() {
    if (globalState.pendingReactions.length || globalState.inBatch || globalState.isRunningReactions) die(36);
    isolateCalled = true;
    if (canMergeGlobalState) {
        var global1 = getGlobal();
        if (--global1.__mobxInstanceCount === 0) global1.__mobxGlobals = undefined;
        globalState = new MobXGlobals();
    }
}
function getGlobalState() {
    return globalState;
}
/**
 * For testing purposes only; this will break the internal state of existing observables,
 * but can be used to get back at a stable state after throwing errors
 */ function resetGlobalState() {
    var defaultGlobals = new MobXGlobals();
    for(var key in defaultGlobals)if (persistentKeys.indexOf(key) === -1) globalState[key] = defaultGlobals[key];
    globalState.allowStateChanges = !globalState.enforceActions;
}
function hasObservers(observable) {
    return observable.observers_ && observable.observers_.size > 0;
}
function getObservers(observable) {
    return observable.observers_;
}
// function invariantObservers(observable: IObservable) {
//     const list = observable.observers
//     const map = observable.observersIndexes
//     const l = list.length
//     for (let i = 0; i < l; i++) {
//         const id = list[i].__mapid
//         if (i) {
//             invariant(map[id] === i, "INTERNAL ERROR maps derivation.__mapid to index in list") // for performance
//         } else {
//             invariant(!(id in map), "INTERNAL ERROR observer on index 0 shouldn't be held in map.") // for performance
//         }
//     }
//     invariant(
//         list.length === 0 || Object.keys(map).length === list.length - 1,
//         "INTERNAL ERROR there is no junk in map"
//     )
// }
function addObserver(observable, node) {
    // invariant(node.dependenciesState !== -1, "INTERNAL ERROR, can add only dependenciesState !== -1");
    // invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR add already added node");
    // invariantObservers(observable);
    observable.observers_.add(node);
    if (observable.lowestObserverState_ > node.dependenciesState_) observable.lowestObserverState_ = node.dependenciesState_;
// invariantObservers(observable);
// invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR didn't add node");
}
function removeObserver(observable, node) {
    // invariant(globalState.inBatch > 0, "INTERNAL ERROR, remove should be called only inside batch");
    // invariant(observable._observers.indexOf(node) !== -1, "INTERNAL ERROR remove already removed node");
    // invariantObservers(observable);
    observable.observers_["delete"](node);
    if (observable.observers_.size === 0) // deleting last observer
    queueForUnobservation(observable);
// invariantObservers(observable);
// invariant(observable._observers.indexOf(node) === -1, "INTERNAL ERROR remove already removed node2");
}
function queueForUnobservation(observable) {
    if (observable.isPendingUnobservation === false) {
        // invariant(observable._observers.length === 0, "INTERNAL ERROR, should only queue for unobservation unobserved observables");
        observable.isPendingUnobservation = true;
        globalState.pendingUnobservations.push(observable);
    }
}
/**
 * Batch starts a transaction, at least for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */ function startBatch() {
    globalState.inBatch++;
}
function endBatch() {
    if (--globalState.inBatch === 0) {
        runReactions();
        // the batch is actually about to finish, all unobserving should happen here.
        var list = globalState.pendingUnobservations;
        for(var i = 0; i < list.length; i++){
            var observable = list[i];
            observable.isPendingUnobservation = false;
            if (observable.observers_.size === 0) {
                if (observable.isBeingObserved) {
                    // if this observable had reactive observers, trigger the hooks
                    observable.isBeingObserved = false;
                    observable.onBUO();
                }
                if (observable instanceof ComputedValue) // computed values are automatically teared down when the last observer leaves
                // this process happens recursively, this computed might be the last observabe of another, etc..
                observable.suspend_();
            }
        }
        globalState.pendingUnobservations = [];
    }
}
function reportObserved(observable) {
    checkIfStateReadsAreAllowed(observable);
    var derivation = globalState.trackingDerivation;
    if (derivation !== null) {
        /**
     * Simple optimization, give each derivation run an unique id (runId)
     * Check if last time this observable was accessed the same runId is used
     * if this is the case, the relation is already known
     */ if (derivation.runId_ !== observable.lastAccessedBy_) {
            observable.lastAccessedBy_ = derivation.runId_;
            // Tried storing newObserving, or observing, or both as Set, but performance didn't come close...
            derivation.newObserving_[derivation.unboundDepsCount_++] = observable;
            if (!observable.isBeingObserved && globalState.trackingContext) {
                observable.isBeingObserved = true;
                observable.onBO();
            }
        }
        return observable.isBeingObserved;
    } else if (observable.observers_.size === 0 && globalState.inBatch > 0) queueForUnobservation(observable);
    return false;
}
// function invariantLOS(observable: IObservable, msg: string) {
//     // it's expensive so better not run it in produciton. but temporarily helpful for testing
//     const min = getObservers(observable).reduce((a, b) => Math.min(a, b.dependenciesState), 2)
//     if (min >= observable.lowestObserverState) return // <- the only assumption about `lowestObserverState`
//     throw new Error(
//         "lowestObserverState is wrong for " +
//             msg +
//             " because " +
//             min +
//             " < " +
//             observable.lowestObserverState
//     )
// }
/**
 * NOTE: current propagation mechanism will in case of self reruning autoruns behave unexpectedly
 * It will propagate changes to observers from previous run
 * It's hard or maybe impossible (with reasonable perf) to get it right with current approach
 * Hopefully self reruning autoruns aren't a feature people should depend on
 * Also most basic use cases should be ok
 */ // Called by Atom when its value changes
function propagateChanged(observable) {
    // invariantLOS(observable, "changed start");
    if (observable.lowestObserverState_ === IDerivationState_.STALE_) return;
    observable.lowestObserverState_ = IDerivationState_.STALE_;
    // Ideally we use for..of here, but the downcompiled version is really slow...
    observable.observers_.forEach(function(d) {
        if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) d.onBecomeStale_();
        d.dependenciesState_ = IDerivationState_.STALE_;
    });
// invariantLOS(observable, "changed end");
}
// Called by ComputedValue when it recalculate and its value changed
function propagateChangeConfirmed(observable) {
    // invariantLOS(observable, "confirmed start");
    if (observable.lowestObserverState_ === IDerivationState_.STALE_) return;
    observable.lowestObserverState_ = IDerivationState_.STALE_;
    observable.observers_.forEach(function(d) {
        if (d.dependenciesState_ === IDerivationState_.POSSIBLY_STALE_) d.dependenciesState_ = IDerivationState_.STALE_;
        else if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_ // this happens during computing of `d`, just keep lowestObserverState up to date.
        ) observable.lowestObserverState_ = IDerivationState_.UP_TO_DATE_;
    });
// invariantLOS(observable, "confirmed end");
}
// Used by computed when its dependency changed, but we don't wan't to immediately recompute.
function propagateMaybeChanged(observable) {
    // invariantLOS(observable, "maybe start");
    if (observable.lowestObserverState_ !== IDerivationState_.UP_TO_DATE_) return;
    observable.lowestObserverState_ = IDerivationState_.POSSIBLY_STALE_;
    observable.observers_.forEach(function(d) {
        if (d.dependenciesState_ === IDerivationState_.UP_TO_DATE_) {
            d.dependenciesState_ = IDerivationState_.POSSIBLY_STALE_;
            d.onBecomeStale_();
        }
    });
// invariantLOS(observable, "maybe end");
}
function logTraceInfo(derivation, observable) {
    console.log("[mobx.trace] '" + derivation.name_ + "' is invalidated due to a change in: '" + observable.name_ + "'");
    if (derivation.isTracing_ === TraceMode.BREAK) {
        var lines = [];
        printDepTree(getDependencyTree(derivation), lines, 1);
        // prettier-ignore
        new Function("debugger;\n/*\nTracing '" + derivation.name_ + "'\n\nYou are entering this break point because derivation '" + derivation.name_ + "' is being traced and '" + observable.name_ + "' is now forcing it to update.\nJust follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update\nThe stackframe you are looking for is at least ~6-8 stack-frames up.\n\n" + (derivation instanceof ComputedValue ? derivation.derivation.toString().replace(/[*]\//g, "/") : "") + "\n\nThe dependencies for this derivation are:\n\n" + lines.join("\n") + "\n*/\n    ")();
    }
}
function printDepTree(tree, lines, depth) {
    if (lines.length >= 1000) {
        lines.push("(and many more)");
        return;
    }
    lines.push("" + "\t".repeat(depth - 1) + tree.name);
    if (tree.dependencies) tree.dependencies.forEach(function(child) {
        return printDepTree(child, lines, depth + 1);
    });
}
var Reaction = /*#__PURE__*/ function() {
    function Reaction(name_, onInvalidate_, errorHandler_, requiresObservable_) {
        if (name_ === void 0) name_ = "Reaction";
        this.name_ = void 0;
        this.onInvalidate_ = void 0;
        this.errorHandler_ = void 0;
        this.requiresObservable_ = void 0;
        this.observing_ = [];
        // nodes we are looking at. Our value depends on these nodes
        this.newObserving_ = [];
        this.dependenciesState_ = IDerivationState_.NOT_TRACKING_;
        this.runId_ = 0;
        this.unboundDepsCount_ = 0;
        this.flags_ = 0;
        this.isTracing_ = TraceMode.NONE;
        this.name_ = name_;
        this.onInvalidate_ = onInvalidate_;
        this.errorHandler_ = errorHandler_;
        this.requiresObservable_ = requiresObservable_;
    }
    var _proto = Reaction.prototype;
    _proto.onBecomeStale_ = function onBecomeStale_() {
        this.schedule_();
    };
    _proto.schedule_ = function schedule_() {
        if (!this.isScheduled) {
            this.isScheduled = true;
            globalState.pendingReactions.push(this);
            runReactions();
        }
    } /**
   * internal, use schedule() if you intend to kick off a reaction
   */ ;
    _proto.runReaction_ = function runReaction_() {
        if (!this.isDisposed) {
            startBatch();
            this.isScheduled = false;
            var prev = globalState.trackingContext;
            globalState.trackingContext = this;
            if (shouldCompute(this)) {
                this.isTrackPending = true;
                try {
                    this.onInvalidate_();
                } catch (e) {
                    this.reportExceptionInDerivation_(e);
                }
            }
            globalState.trackingContext = prev;
            endBatch();
        }
    };
    _proto.track = function track(fn) {
        if (this.isDisposed) return;
        startBatch();
        var notify = isSpyEnabled();
        var startTime;
        this.isRunning = true;
        var prevReaction = globalState.trackingContext; // reactions could create reactions...
        globalState.trackingContext = this;
        var result = trackDerivedFunction(this, fn, undefined);
        globalState.trackingContext = prevReaction;
        this.isRunning = false;
        this.isTrackPending = false;
        if (this.isDisposed) // disposed during last run. Clean up everything that was bound after the dispose call.
        clearObserving(this);
        if (isCaughtException(result)) this.reportExceptionInDerivation_(result.cause);
        endBatch();
    };
    _proto.reportExceptionInDerivation_ = function reportExceptionInDerivation_(error) {
        var _this = this;
        if (this.errorHandler_) {
            this.errorHandler_(error, this);
            return;
        }
        if (globalState.disableErrorBoundaries) throw error;
        var message = "[mobx] uncaught error in '" + this + "'";
        if (!globalState.suppressReactionErrors) console.error(message, error);
         // prettier-ignore
        globalState.globalReactionErrorHandlers.forEach(function(f) {
            return f(error, _this);
        });
    };
    _proto.dispose = function dispose() {
        if (!this.isDisposed) {
            this.isDisposed = true;
            if (!this.isRunning) {
                // if disposed while running, clean up later. Maybe not optimal, but rare case
                startBatch();
                clearObserving(this);
                endBatch();
            }
        }
    };
    _proto.getDisposer_ = function getDisposer_(abortSignal) {
        var _this2 = this;
        var dispose = function dispose() {
            _this2.dispose();
            abortSignal == null || abortSignal.removeEventListener == null || abortSignal.removeEventListener("abort", dispose);
        };
        abortSignal == null || abortSignal.addEventListener == null || abortSignal.addEventListener("abort", dispose);
        dispose[$mobx] = this;
        return dispose;
    };
    _proto.toString = function toString() {
        return "Reaction[" + this.name_ + "]";
    };
    _proto.trace = function trace$1(enterBreakPoint) {
        if (enterBreakPoint === void 0) enterBreakPoint = false;
        trace(this, enterBreakPoint);
    };
    return _createClass(Reaction, [
        {
            key: "isDisposed",
            get: function get() {
                return getFlag(this.flags_, Reaction.isDisposedMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Reaction.isDisposedMask_, newValue);
            }
        },
        {
            key: "isScheduled",
            get: function get() {
                return getFlag(this.flags_, Reaction.isScheduledMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Reaction.isScheduledMask_, newValue);
            }
        },
        {
            key: "isTrackPending",
            get: function get() {
                return getFlag(this.flags_, Reaction.isTrackPendingMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Reaction.isTrackPendingMask_, newValue);
            }
        },
        {
            key: "isRunning",
            get: function get() {
                return getFlag(this.flags_, Reaction.isRunningMask_);
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Reaction.isRunningMask_, newValue);
            }
        },
        {
            key: "diffValue",
            get: function get() {
                return getFlag(this.flags_, Reaction.diffValueMask_) ? 1 : 0;
            },
            set: function set(newValue) {
                this.flags_ = setFlag(this.flags_, Reaction.diffValueMask_, newValue === 1 ? true : false);
            }
        }
    ]);
}();
Reaction.isDisposedMask_ = 1;
Reaction.isScheduledMask_ = 2;
Reaction.isTrackPendingMask_ = 4;
Reaction.isRunningMask_ = 8;
Reaction.diffValueMask_ = 16;
function onReactionError(handler) {
    globalState.globalReactionErrorHandlers.push(handler);
    return function() {
        var idx = globalState.globalReactionErrorHandlers.indexOf(handler);
        if (idx >= 0) globalState.globalReactionErrorHandlers.splice(idx, 1);
    };
}
/**
 * Magic number alert!
 * Defines within how many times a reaction is allowed to re-trigger itself
 * until it is assumed that this is gonna be a never ending loop...
 */ var MAX_REACTION_ITERATIONS = 100;
var reactionScheduler = function reactionScheduler(f) {
    return f();
};
function runReactions() {
    // Trampolining, if runReactions are already running, new reactions will be picked up
    if (globalState.inBatch > 0 || globalState.isRunningReactions) return;
    reactionScheduler(runReactionsHelper);
}
function runReactionsHelper() {
    globalState.isRunningReactions = true;
    var allReactions = globalState.pendingReactions;
    var iterations = 0;
    // While running reactions, new reactions might be triggered.
    // Hence we work with two variables and check whether
    // we converge to no remaining reactions after a while.
    while(allReactions.length > 0){
        if (++iterations === MAX_REACTION_ITERATIONS) {
            console.error("[mobx] cycle in reaction: " + allReactions[0]);
            allReactions.splice(0); // clear reactions
        }
        var remainingReactions = allReactions.splice(0);
        for(var i = 0, l = remainingReactions.length; i < l; i++)remainingReactions[i].runReaction_();
    }
    globalState.isRunningReactions = false;
}
var isReaction = /*#__PURE__*/ createInstanceofPredicate("Reaction", Reaction);
function setReactionScheduler(fn) {
    var baseScheduler = reactionScheduler;
    reactionScheduler = function reactionScheduler(f) {
        return fn(function() {
            return baseScheduler(f);
        });
    };
}
function isSpyEnabled() {
    return false;
}
function spyReport(event) {
    var listeners, i, l;
    return;
}
function spyReportStart(event) {
    var change;
    return;
}
var END_EVENT = (/* unused pure expression or super */ null && ({
    type: "report-end",
    spyReportEnd: true
}));
function spyReportEnd(change) {
    return;
}
function spy(listener) {
    console.warn("[mobx.spy] Is a no-op in production builds");
    return function() {};
}
var ACTION = "action";
var ACTION_BOUND = "action.bound";
var AUTOACTION = "autoAction";
var AUTOACTION_BOUND = "autoAction.bound";
var DEFAULT_ACTION_NAME = "<unnamed action>";
var actionAnnotation = /*#__PURE__*/ createActionAnnotation(ACTION);
var actionBoundAnnotation = /*#__PURE__*/ createActionAnnotation(ACTION_BOUND, {
    bound: true
});
var autoActionAnnotation = /*#__PURE__*/ createActionAnnotation(AUTOACTION, {
    autoAction: true
});
var autoActionBoundAnnotation = /*#__PURE__*/ createActionAnnotation(AUTOACTION_BOUND, {
    autoAction: true,
    bound: true
});
function createActionFactory(autoAction) {
    var res = function action(arg1, arg2) {
        // action(fn() {})
        if (isFunction(arg1)) return createAction(arg1.name || DEFAULT_ACTION_NAME, arg1, autoAction);
        // action("name", fn() {})
        if (isFunction(arg2)) return createAction(arg1, arg2, autoAction);
        // @action (2022.3 Decorators)
        if (is20223Decorator(arg2)) return (autoAction ? autoActionAnnotation : actionAnnotation).decorate_20223_(arg1, arg2);
        // @action
        if (isStringish(arg2)) return storeAnnotation(arg1, arg2, autoAction ? autoActionAnnotation : actionAnnotation);
        // action("name") & @action("name")
        if (isStringish(arg1)) return createDecoratorAnnotation(createActionAnnotation(autoAction ? AUTOACTION : ACTION, {
            name: arg1,
            autoAction: autoAction
        }));
    };
    return res;
}
var action = /*#__PURE__*/ createActionFactory(false);
Object.assign(action, actionAnnotation);
var autoAction = /*#__PURE__*/ createActionFactory(true);
Object.assign(autoAction, autoActionAnnotation);
action.bound = /*#__PURE__*/ createDecoratorAnnotation(actionBoundAnnotation);
autoAction.bound = /*#__PURE__*/ createDecoratorAnnotation(autoActionBoundAnnotation);
function runInAction(fn) {
    return executeAction(fn.name || DEFAULT_ACTION_NAME, false, fn, this, undefined);
}
function isAction(thing) {
    return isFunction(thing) && thing.isMobxAction === true;
}
/**
 * Creates a named reactive view and keeps it alive, so that the view is always
 * updated if one of the dependencies changes, even when the view is not further used by something else.
 * @param view The reactive view
 * @returns disposer function, which can be used to stop the view from being updated in the future.
 */ function autorun(view, opts) {
    var _opts$name, _opts, _opts2, _opts3;
    if (opts === void 0) opts = EMPTY_OBJECT;
    var name = (_opts$name = (_opts = opts) == null ? void 0 : _opts.name) != null ? _opts$name : "Autorun";
    var runSync = !opts.scheduler && !opts.delay;
    var reaction;
    if (runSync) // normal autorun
    reaction = new Reaction(name, function() {
        this.track(reactionRunner);
    }, opts.onError, opts.requiresObservable);
    else {
        var scheduler = createSchedulerFromOptions(opts);
        // debounced autorun
        var isScheduled = false;
        reaction = new Reaction(name, function() {
            if (!isScheduled) {
                isScheduled = true;
                scheduler(function() {
                    isScheduled = false;
                    if (!reaction.isDisposed) reaction.track(reactionRunner);
                });
            }
        }, opts.onError, opts.requiresObservable);
    }
    function reactionRunner() {
        view(reaction);
    }
    if (!((_opts2 = opts) != null && (_opts2 = _opts2.signal) != null && _opts2.aborted)) reaction.schedule_();
    return reaction.getDisposer_((_opts3 = opts) == null ? void 0 : _opts3.signal);
}
var run = function run(f) {
    return f();
};
function createSchedulerFromOptions(opts) {
    return opts.scheduler ? opts.scheduler : opts.delay ? function(f) {
        return setTimeout(f, opts.delay);
    } : run;
}
function reaction(expression, effect, opts) {
    var _opts$name2, _opts4, _opts5;
    if (opts === void 0) opts = EMPTY_OBJECT;
    var name = (_opts$name2 = opts.name) != null ? _opts$name2 : "Reaction";
    var effectAction = action(name, opts.onError ? wrapErrorHandler(opts.onError, effect) : effect);
    var runSync = !opts.scheduler && !opts.delay;
    var scheduler = createSchedulerFromOptions(opts);
    var firstTime = true;
    var isScheduled = false;
    var value;
    var equals = opts.compareStructural ? comparer.structural : opts.equals || comparer["default"];
    var r = new Reaction(name, function() {
        if (firstTime || runSync) reactionRunner();
        else if (!isScheduled) {
            isScheduled = true;
            scheduler(reactionRunner);
        }
    }, opts.onError, opts.requiresObservable);
    function reactionRunner() {
        isScheduled = false;
        if (r.isDisposed) return;
        var changed = false;
        var oldValue = value;
        r.track(function() {
            var nextValue = allowStateChanges(false, function() {
                return expression(r);
            });
            changed = firstTime || !equals(value, nextValue);
            value = nextValue;
        });
        if (firstTime && opts.fireImmediately) effectAction(value, oldValue, r);
        else if (!firstTime && changed) effectAction(value, oldValue, r);
        firstTime = false;
    }
    if (!((_opts4 = opts) != null && (_opts4 = _opts4.signal) != null && _opts4.aborted)) r.schedule_();
    return r.getDisposer_((_opts5 = opts) == null ? void 0 : _opts5.signal);
}
function wrapErrorHandler(errorHandler, baseFn) {
    return function() {
        try {
            return baseFn.apply(this, arguments);
        } catch (e) {
            errorHandler.call(this, e);
        }
    };
}
var ON_BECOME_OBSERVED = "onBO";
var ON_BECOME_UNOBSERVED = "onBUO";
function onBecomeObserved(thing, arg2, arg3) {
    return interceptHook(ON_BECOME_OBSERVED, thing, arg2, arg3);
}
function onBecomeUnobserved(thing, arg2, arg3) {
    return interceptHook(ON_BECOME_UNOBSERVED, thing, arg2, arg3);
}
function interceptHook(hook, thing, arg2, arg3) {
    var atom = typeof arg3 === "function" ? getAtom(thing, arg2) : getAtom(thing);
    var cb = isFunction(arg3) ? arg3 : arg2;
    var listenersKey = hook + "L";
    if (atom[listenersKey]) atom[listenersKey].add(cb);
    else atom[listenersKey] = new Set([
        cb
    ]);
    return function() {
        var hookListeners = atom[listenersKey];
        if (hookListeners) {
            hookListeners["delete"](cb);
            if (hookListeners.size === 0) delete atom[listenersKey];
        }
    };
}
var NEVER = "never";
var ALWAYS = "always";
var OBSERVED = "observed";
// const IF_AVAILABLE = "ifavailable"
function configure(options) {
    if (options.isolateGlobalState === true) isolateGlobalState();
    var useProxies = options.useProxies, enforceActions = options.enforceActions;
    if (useProxies !== undefined) globalState.useProxies = useProxies === ALWAYS ? true : useProxies === NEVER ? false : typeof Proxy !== "undefined";
    if (useProxies === "ifavailable") globalState.verifyProxies = true;
    if (enforceActions !== undefined) {
        var ea = enforceActions === ALWAYS ? ALWAYS : enforceActions === OBSERVED;
        globalState.enforceActions = ea;
        globalState.allowStateChanges = ea === true || ea === ALWAYS ? false : true;
    }
    [
        "computedRequiresReaction",
        "reactionRequiresObservable",
        "observableRequiresReaction",
        "disableErrorBoundaries",
        "safeDescriptors"
    ].forEach(function(key) {
        if (key in options) globalState[key] = !!options[key];
    });
    globalState.allowStateReads = !globalState.observableRequiresReaction;
    if (options.reactionScheduler) setReactionScheduler(options.reactionScheduler);
}
function extendObservable(target, properties, annotations, options) {
    // Pull descriptors first, so we don't have to deal with props added by administration ($mobx)
    var descriptors = getOwnPropertyDescriptors(properties);
    initObservable(function() {
        var adm = asObservableObject(target, options)[$mobx];
        ownKeys(descriptors).forEach(function(key) {
            adm.extend_(key, descriptors[key], // must pass "undefined" for { key: undefined }
            !annotations ? true : key in annotations ? annotations[key] : true);
        });
    });
    return target;
}
function getDependencyTree(thing, property) {
    return nodeToDependencyTree(getAtom(thing, property));
}
function nodeToDependencyTree(node) {
    var result = {
        name: node.name_
    };
    if (node.observing_ && node.observing_.length > 0) result.dependencies = unique(node.observing_).map(nodeToDependencyTree);
    return result;
}
function getObserverTree(thing, property) {
    return nodeToObserverTree(getAtom(thing, property));
}
function nodeToObserverTree(node) {
    var result = {
        name: node.name_
    };
    if (hasObservers(node)) result.observers = Array.from(getObservers(node)).map(nodeToObserverTree);
    return result;
}
function unique(list) {
    return Array.from(new Set(list));
}
var generatorId = 0;
function FlowCancellationError() {
    this.message = "FLOW_CANCELLED";
}
FlowCancellationError.prototype = /*#__PURE__*/ Object.create(Error.prototype);
function isFlowCancellationError(error) {
    return error instanceof FlowCancellationError;
}
var flowAnnotation = /*#__PURE__*/ createFlowAnnotation("flow");
var flowBoundAnnotation = /*#__PURE__*/ createFlowAnnotation("flow.bound", {
    bound: true
});
var flow = /*#__PURE__*/ Object.assign(function flow(arg1, arg2) {
    // @flow (2022.3 Decorators)
    if (is20223Decorator(arg2)) return flowAnnotation.decorate_20223_(arg1, arg2);
    // @flow
    if (isStringish(arg2)) return storeAnnotation(arg1, arg2, flowAnnotation);
    var generator = arg1;
    var name = generator.name || "<unnamed flow>";
    // Implementation based on https://github.com/tj/co/blob/master/index.js
    var res = function res() {
        var ctx = this;
        var args = arguments;
        var runId = ++generatorId;
        var gen = action(name + " - runid: " + runId + " - init", generator).apply(ctx, args);
        var rejector;
        var pendingPromise = undefined;
        var promise = new Promise(function(resolve, reject) {
            var stepId = 0;
            rejector = reject;
            function onFulfilled(res) {
                pendingPromise = undefined;
                var ret;
                try {
                    ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen.next).call(gen, res);
                } catch (e) {
                    return reject(e);
                }
                next(ret);
            }
            function onRejected(err) {
                pendingPromise = undefined;
                var ret;
                try {
                    ret = action(name + " - runid: " + runId + " - yield " + stepId++, gen["throw"]).call(gen, err);
                } catch (e) {
                    return reject(e);
                }
                next(ret);
            }
            function next(ret) {
                if (isFunction(ret == null ? void 0 : ret.then)) {
                    // an async iterator
                    ret.then(next, reject);
                    return;
                }
                if (ret.done) return resolve(ret.value);
                pendingPromise = Promise.resolve(ret.value);
                return pendingPromise.then(onFulfilled, onRejected);
            }
            onFulfilled(undefined); // kick off the process
        });
        promise.cancel = action(name + " - runid: " + runId + " - cancel", function() {
            try {
                if (pendingPromise) cancelPromise(pendingPromise);
                // Finally block can return (or yield) stuff..
                var _res = gen["return"](undefined);
                // eat anything that promise would do, it's cancelled!
                var yieldedPromise = Promise.resolve(_res.value);
                yieldedPromise.then(noop, noop);
                cancelPromise(yieldedPromise); // maybe it can be cancelled :)
                // reject our original promise
                rejector(new FlowCancellationError());
            } catch (e) {
                rejector(e); // there could be a throwing finally block
            }
        });
        return promise;
    };
    res.isMobXFlow = true;
    return res;
}, flowAnnotation);
flow.bound = /*#__PURE__*/ createDecoratorAnnotation(flowBoundAnnotation);
function cancelPromise(promise) {
    if (isFunction(promise.cancel)) promise.cancel();
}
function flowResult(result) {
    return result; // just tricking TypeScript :)
}
function isFlow(fn) {
    return (fn == null ? void 0 : fn.isMobXFlow) === true;
}
function interceptReads(thing, propOrHandler, handler) {
    var target;
    if (isObservableMap(thing) || isObservableArray(thing) || isObservableValue(thing)) target = getAdministration(thing);
    else if (isObservableObject(thing)) target = getAdministration(thing, propOrHandler);
    target.dehancer = typeof propOrHandler === "function" ? propOrHandler : handler;
    return function() {
        target.dehancer = undefined;
    };
}
function intercept(thing, propOrHandler, handler) {
    if (isFunction(handler)) return interceptProperty(thing, propOrHandler, handler);
    else return interceptInterceptable(thing, propOrHandler);
}
function interceptInterceptable(thing, handler) {
    return getAdministration(thing).intercept_(handler);
}
function interceptProperty(thing, property, handler) {
    return getAdministration(thing, property).intercept_(handler);
}
function _isComputed(value, property) {
    if (property === undefined) return isComputedValue(value);
    if (isObservableObject(value) === false) return false;
    if (!value[$mobx].values_.has(property)) return false;
    var atom = getAtom(value, property);
    return isComputedValue(atom);
}
function isComputed(value) {
    return _isComputed(value);
}
function isComputedProp(value, propName) {
    return _isComputed(value, propName);
}
function _isObservable(value, property) {
    if (!value) return false;
    if (property !== undefined) {
        if (isObservableObject(value)) return value[$mobx].values_.has(property);
        return false;
    }
    // For first check, see #701
    return isObservableObject(value) || !!value[$mobx] || isAtom(value) || isReaction(value) || isComputedValue(value);
}
function isObservable(value) {
    return _isObservable(value);
}
function isObservableProp(value, propName) {
    return _isObservable(value, propName);
}
function keys(obj) {
    if (isObservableObject(obj)) return obj[$mobx].keys_();
    if (isObservableMap(obj) || isObservableSet(obj)) return Array.from(obj.keys());
    if (isObservableArray(obj)) return obj.map(function(_, index) {
        return index;
    });
    die(5);
}
function values(obj) {
    if (isObservableObject(obj)) return keys(obj).map(function(key) {
        return obj[key];
    });
    if (isObservableMap(obj)) return keys(obj).map(function(key) {
        return obj.get(key);
    });
    if (isObservableSet(obj)) return Array.from(obj.values());
    if (isObservableArray(obj)) return obj.slice();
    die(6);
}
function entries(obj) {
    if (isObservableObject(obj)) return keys(obj).map(function(key) {
        return [
            key,
            obj[key]
        ];
    });
    if (isObservableMap(obj)) return keys(obj).map(function(key) {
        return [
            key,
            obj.get(key)
        ];
    });
    if (isObservableSet(obj)) return Array.from(obj.entries());
    if (isObservableArray(obj)) return obj.map(function(key, index) {
        return [
            index,
            key
        ];
    });
    die(7);
}
function set(obj, key, value) {
    if (arguments.length === 2 && !isObservableSet(obj)) {
        startBatch();
        var _values = key;
        try {
            for(var _key in _values)set(obj, _key, _values[_key]);
        } finally{
            endBatch();
        }
        return;
    }
    if (isObservableObject(obj)) obj[$mobx].set_(key, value);
    else if (isObservableMap(obj)) obj.set(key, value);
    else if (isObservableSet(obj)) obj.add(key);
    else if (isObservableArray(obj)) {
        if (typeof key !== "number") key = parseInt(key, 10);
        if (key < 0) die("Invalid index: '" + key + "'");
        startBatch();
        if (key >= obj.length) obj.length = key + 1;
        obj[key] = value;
        endBatch();
    } else die(8);
}
function remove(obj, key) {
    if (isObservableObject(obj)) obj[$mobx].delete_(key);
    else if (isObservableMap(obj)) obj["delete"](key);
    else if (isObservableSet(obj)) obj["delete"](key);
    else if (isObservableArray(obj)) {
        if (typeof key !== "number") key = parseInt(key, 10);
        obj.splice(key, 1);
    } else die(9);
}
function has(obj, key) {
    if (isObservableObject(obj)) return obj[$mobx].has_(key);
    else if (isObservableMap(obj)) return obj.has(key);
    else if (isObservableSet(obj)) return obj.has(key);
    else if (isObservableArray(obj)) return key >= 0 && key < obj.length;
    die(10);
}
function get(obj, key) {
    if (!has(obj, key)) return undefined;
    if (isObservableObject(obj)) return obj[$mobx].get_(key);
    else if (isObservableMap(obj)) return obj.get(key);
    else if (isObservableArray(obj)) return obj[key];
    die(11);
}
function apiDefineProperty(obj, key, descriptor) {
    if (isObservableObject(obj)) return obj[$mobx].defineProperty_(key, descriptor);
    die(39);
}
function apiOwnKeys(obj) {
    if (isObservableObject(obj)) return obj[$mobx].ownKeys_();
    die(38);
}
function observe(thing, propOrCb, cbOrFire, fireImmediately) {
    if (isFunction(cbOrFire)) return observeObservableProperty(thing, propOrCb, cbOrFire, fireImmediately);
    else return observeObservable(thing, propOrCb, cbOrFire);
}
function observeObservable(thing, listener, fireImmediately) {
    return getAdministration(thing).observe_(listener, fireImmediately);
}
function observeObservableProperty(thing, property, listener, fireImmediately) {
    return getAdministration(thing, property).observe_(listener, fireImmediately);
}
function cache(map, key, value) {
    map.set(key, value);
    return value;
}
function toJSHelper(source, __alreadySeen) {
    if (source == null || typeof source !== "object" || source instanceof Date || !isObservable(source)) return source;
    if (isObservableValue(source) || isComputedValue(source)) return toJSHelper(source.get(), __alreadySeen);
    if (__alreadySeen.has(source)) return __alreadySeen.get(source);
    if (isObservableArray(source)) {
        var res = cache(__alreadySeen, source, new Array(source.length));
        source.forEach(function(value, idx) {
            res[idx] = toJSHelper(value, __alreadySeen);
        });
        return res;
    }
    if (isObservableSet(source)) {
        var _res = cache(__alreadySeen, source, new Set());
        source.forEach(function(value) {
            _res.add(toJSHelper(value, __alreadySeen));
        });
        return _res;
    }
    if (isObservableMap(source)) {
        var _res2 = cache(__alreadySeen, source, new Map());
        source.forEach(function(value, key) {
            _res2.set(key, toJSHelper(value, __alreadySeen));
        });
        return _res2;
    } else {
        // must be observable object
        var _res3 = cache(__alreadySeen, source, {});
        apiOwnKeys(source).forEach(function(key) {
            if (objectPrototype.propertyIsEnumerable.call(source, key)) _res3[key] = toJSHelper(source[key], __alreadySeen);
        });
        return _res3;
    }
}
/**
 * Recursively converts an observable to it's non-observable native counterpart.
 * It does NOT recurse into non-observables, these are left as they are, even if they contain observables.
 * Computed and other non-enumerable properties are completely ignored.
 * Complex scenarios require custom solution, eg implementing `toJSON` or using `serializr` lib.
 */ function toJS(source, options) {
    return toJSHelper(source, new Map());
}
function trace() {
    var enterBreakPoint, _len, args, _key, derivation;
    return;
}
function getAtomFromArgs(args) {
    switch(args.length){
        case 0:
            return globalState.trackingDerivation;
        case 1:
            return getAtom(args[0]);
        case 2:
            return getAtom(args[0], args[1]);
    }
}
/**
 * During a transaction no views are updated until the end of the transaction.
 * The transaction will be run synchronously nonetheless.
 *
 * @param action a function that updates some reactive state
 * @returns any value that was returned by the 'action' parameter.
 */ function transaction(action, thisArg) {
    if (thisArg === void 0) thisArg = undefined;
    startBatch();
    try {
        return action.apply(thisArg);
    } finally{
        endBatch();
    }
}
function when(predicate, arg1, arg2) {
    if (arguments.length === 1 || arg1 && typeof arg1 === "object") return whenPromise(predicate, arg1);
    return _when(predicate, arg1, arg2 || {});
}
function _when(predicate, effect, opts) {
    var timeoutHandle;
    if (typeof opts.timeout === "number") {
        var error = new Error("WHEN_TIMEOUT");
        timeoutHandle = setTimeout(function() {
            if (!disposer[$mobx].isDisposed) {
                disposer();
                if (opts.onError) opts.onError(error);
                else throw error;
            }
        }, opts.timeout);
    }
    opts.name = "When";
    var effectAction = createAction("When-effect", effect);
    // eslint-disable-next-line
    var disposer = autorun(function(r) {
        // predicate should not change state
        var cond = allowStateChanges(false, predicate);
        if (cond) {
            r.dispose();
            if (timeoutHandle) clearTimeout(timeoutHandle);
            effectAction();
        }
    }, opts);
    return disposer;
}
function whenPromise(predicate, opts) {
    var _opts$signal;
    if (opts != null && (_opts$signal = opts.signal) != null && _opts$signal.aborted) return Object.assign(Promise.reject(new Error("WHEN_ABORTED")), {
        cancel: function cancel() {
            return null;
        }
    });
    var cancel;
    var abort;
    var res = new Promise(function(resolve, reject) {
        var _opts$signal2;
        var disposer = _when(predicate, resolve, _extends({}, opts, {
            onError: reject
        }));
        cancel = function cancel() {
            disposer();
            reject(new Error("WHEN_CANCELLED"));
        };
        abort = function abort() {
            disposer();
            reject(new Error("WHEN_ABORTED"));
        };
        opts == null || (_opts$signal2 = opts.signal) == null || _opts$signal2.addEventListener == null || _opts$signal2.addEventListener("abort", abort);
    })["finally"](function() {
        var _opts$signal3;
        return opts == null || (_opts$signal3 = opts.signal) == null || _opts$signal3.removeEventListener == null ? void 0 : _opts$signal3.removeEventListener("abort", abort);
    });
    res.cancel = cancel;
    return res;
}
function getAdm(target) {
    return target[$mobx];
}
// Optimization: we don't need the intermediate objects and could have a completely custom administration for DynamicObjects,
// and skip either the internal values map, or the base object with its property descriptors!
var objectProxyTraps = {
    has: function has(target, name) {
        return getAdm(target).has_(name);
    },
    get: function get(target, name) {
        return getAdm(target).get_(name);
    },
    set: function set(target, name, value) {
        var _getAdm$set_;
        if (!isStringish(name)) return false;
        // null (intercepted) -> true (success)
        return (_getAdm$set_ = getAdm(target).set_(name, value, true)) != null ? _getAdm$set_ : true;
    },
    deleteProperty: function deleteProperty(target, name) {
        var _getAdm$delete_;
        if (!isStringish(name)) return false;
        // null (intercepted) -> true (success)
        return (_getAdm$delete_ = getAdm(target).delete_(name, true)) != null ? _getAdm$delete_ : true;
    },
    defineProperty: function defineProperty(target, name, descriptor) {
        var _getAdm$definePropert;
        // null (intercepted) -> true (success)
        return (_getAdm$definePropert = getAdm(target).defineProperty_(name, descriptor)) != null ? _getAdm$definePropert : true;
    },
    ownKeys: function ownKeys(target) {
        return getAdm(target).ownKeys_();
    },
    preventExtensions: function preventExtensions(target) {
        die(13);
    }
};
function asDynamicObservableObject(target, options) {
    var _target$$mobx, _target$$mobx$proxy_;
    assertProxies();
    target = asObservableObject(target, options);
    return (_target$$mobx$proxy_ = (_target$$mobx = target[$mobx]).proxy_) != null ? _target$$mobx$proxy_ : _target$$mobx.proxy_ = new Proxy(target, objectProxyTraps);
}
function hasInterceptors(interceptable) {
    return interceptable.interceptors_ !== undefined && interceptable.interceptors_.length > 0;
}
function registerInterceptor(interceptable, handler) {
    var interceptors = interceptable.interceptors_ || (interceptable.interceptors_ = []);
    interceptors.push(handler);
    return once(function() {
        var idx = interceptors.indexOf(handler);
        if (idx !== -1) interceptors.splice(idx, 1);
    });
}
function interceptChange(interceptable, change) {
    var prevU = untrackedStart();
    try {
        // Interceptor can modify the array, copy it to avoid concurrent modification, see #1950
        var interceptors = [].concat(interceptable.interceptors_ || []);
        for(var i = 0, l = interceptors.length; i < l; i++){
            change = interceptors[i](change);
            if (change && !change.type) die(14);
            if (!change) break;
        }
        return change;
    } finally{
        untrackedEnd(prevU);
    }
}
function hasListeners(listenable) {
    return listenable.changeListeners_ !== undefined && listenable.changeListeners_.length > 0;
}
function registerListener(listenable, handler) {
    var listeners = listenable.changeListeners_ || (listenable.changeListeners_ = []);
    listeners.push(handler);
    return once(function() {
        var idx = listeners.indexOf(handler);
        if (idx !== -1) listeners.splice(idx, 1);
    });
}
function notifyListeners(listenable, change) {
    var prevU = untrackedStart();
    var listeners = listenable.changeListeners_;
    if (!listeners) return;
    listeners = listeners.slice();
    for(var i = 0, l = listeners.length; i < l; i++)listeners[i](change);
    untrackedEnd(prevU);
}
function makeObservable(target, annotations, options) {
    initObservable(function() {
        var _annotations;
        var adm = asObservableObject(target, options)[$mobx];
        // Default to decorators
        (_annotations = annotations) != null ? _annotations : annotations = collectStoredAnnotations(target);
        // Annotate
        ownKeys(annotations).forEach(function(key) {
            return adm.make_(key, annotations[key]);
        });
    });
    return target;
}
// proto[keysSymbol] = new Set<PropertyKey>()
var keysSymbol = /*#__PURE__*/ (/* unused pure expression or super */ null && (Symbol("mobx-keys")));
function makeAutoObservable(target, overrides, options) {
    // Optimization: avoid visiting protos
    // Assumes that annotation.make_/.extend_ works the same for plain objects
    if (isPlainObject(target)) return extendObservable(target, target, overrides, options);
    initObservable(function() {
        var adm = asObservableObject(target, options)[$mobx];
        // Optimization: cache keys on proto
        // Assumes makeAutoObservable can be called only once per object and can't be used in subclass
        if (!target[keysSymbol]) {
            var proto = Object.getPrototypeOf(target);
            var keys = new Set([].concat(ownKeys(target), ownKeys(proto)));
            keys["delete"]("constructor");
            keys["delete"]($mobx);
            addHiddenProp(proto, keysSymbol, keys);
        }
        target[keysSymbol].forEach(function(key) {
            return adm.make_(key, // must pass "undefined" for { key: undefined }
            !overrides ? true : key in overrides ? overrides[key] : true);
        });
    });
    return target;
}
var SPLICE = "splice";
var UPDATE = "update";
var MAX_SPLICE_SIZE = 10000; // See e.g. https://github.com/mobxjs/mobx/issues/859
var arrayTraps = {
    get: function get(target, name) {
        var adm = target[$mobx];
        if (name === $mobx) return adm;
        if (name === "length") return adm.getArrayLength_();
        if (typeof name === "string" && !isNaN(name)) return adm.get_(parseInt(name));
        if (hasProp(arrayExtensions, name)) return arrayExtensions[name];
        return target[name];
    },
    set: function set(target, name, value) {
        var adm = target[$mobx];
        if (name === "length") adm.setArrayLength_(value);
        if (typeof name === "symbol" || isNaN(name)) target[name] = value;
        else // numeric string
        adm.set_(parseInt(name), value);
        return true;
    },
    preventExtensions: function preventExtensions() {
        die(15);
    }
};
var ObservableArrayAdministration = /*#__PURE__*/ function() {
    function ObservableArrayAdministration(name, enhancer, owned_, legacyMode_) {
        if (name === void 0) name = "ObservableArray";
        this.owned_ = void 0;
        this.legacyMode_ = void 0;
        this.atom_ = void 0;
        this.values_ = [];
        // this is the prop that gets proxied, so can't replace it!
        this.interceptors_ = void 0;
        this.changeListeners_ = void 0;
        this.enhancer_ = void 0;
        this.dehancer = void 0;
        this.proxy_ = void 0;
        this.lastKnownLength_ = 0;
        this.owned_ = owned_;
        this.legacyMode_ = legacyMode_;
        this.atom_ = new Atom(name);
        this.enhancer_ = function(newV, oldV) {
            return enhancer(newV, oldV, "ObservableArray[..]");
        };
    }
    var _proto = ObservableArrayAdministration.prototype;
    _proto.dehanceValue_ = function dehanceValue_(value) {
        if (this.dehancer !== undefined) return this.dehancer(value);
        return value;
    };
    _proto.dehanceValues_ = function dehanceValues_(values) {
        if (this.dehancer !== undefined && values.length > 0) return values.map(this.dehancer);
        return values;
    };
    _proto.intercept_ = function intercept_(handler) {
        return registerInterceptor(this, handler);
    };
    _proto.observe_ = function observe_(listener, fireImmediately) {
        if (fireImmediately === void 0) fireImmediately = false;
        if (fireImmediately) listener({
            observableKind: "array",
            object: this.proxy_,
            debugObjectName: this.atom_.name_,
            type: "splice",
            index: 0,
            added: this.values_.slice(),
            addedCount: this.values_.length,
            removed: [],
            removedCount: 0
        });
        return registerListener(this, listener);
    };
    _proto.getArrayLength_ = function getArrayLength_() {
        this.atom_.reportObserved();
        return this.values_.length;
    };
    _proto.setArrayLength_ = function setArrayLength_(newLength) {
        if (typeof newLength !== "number" || isNaN(newLength) || newLength < 0) die("Out of range: " + newLength);
        var currentLength = this.values_.length;
        if (newLength === currentLength) return;
        else if (newLength > currentLength) {
            var newItems = new Array(newLength - currentLength);
            for(var i = 0; i < newLength - currentLength; i++)newItems[i] = undefined;
             // No Array.fill everywhere...
            this.spliceWithArray_(currentLength, 0, newItems);
        } else this.spliceWithArray_(newLength, currentLength - newLength);
    };
    _proto.updateArrayLength_ = function updateArrayLength_(oldLength, delta) {
        if (oldLength !== this.lastKnownLength_) die(16);
        this.lastKnownLength_ += delta;
        if (this.legacyMode_ && delta > 0) reserveArrayBuffer(oldLength + delta + 1);
    };
    _proto.spliceWithArray_ = function spliceWithArray_(index, deleteCount, newItems) {
        var _this = this;
        checkIfStateModificationsAreAllowed(this.atom_);
        var length = this.values_.length;
        if (index === undefined) index = 0;
        else if (index > length) index = length;
        else if (index < 0) index = Math.max(0, length + index);
        if (arguments.length === 1) deleteCount = length - index;
        else if (deleteCount === undefined || deleteCount === null) deleteCount = 0;
        else deleteCount = Math.max(0, Math.min(deleteCount, length - index));
        if (newItems === undefined) newItems = EMPTY_ARRAY;
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                object: this.proxy_,
                type: SPLICE,
                index: index,
                removedCount: deleteCount,
                added: newItems
            });
            if (!change) return EMPTY_ARRAY;
            deleteCount = change.removedCount;
            newItems = change.added;
        }
        newItems = newItems.length === 0 ? newItems : newItems.map(function(v) {
            return _this.enhancer_(v, undefined);
        });
        if (this.legacyMode_ || false) {
            var lengthDelta = newItems.length - deleteCount;
            this.updateArrayLength_(length, lengthDelta); // checks if internal array wasn't modified
        }
        var res = this.spliceItemsIntoValues_(index, deleteCount, newItems);
        if (deleteCount !== 0 || newItems.length !== 0) this.notifyArraySplice_(index, newItems, res);
        return this.dehanceValues_(res);
    };
    _proto.spliceItemsIntoValues_ = function spliceItemsIntoValues_(index, deleteCount, newItems) {
        if (newItems.length < MAX_SPLICE_SIZE) {
            var _this$values_;
            return (_this$values_ = this.values_).splice.apply(_this$values_, [
                index,
                deleteCount
            ].concat(newItems));
        } else {
            // The items removed by the splice
            var res = this.values_.slice(index, index + deleteCount);
            // The items that that should remain at the end of the array
            var oldItems = this.values_.slice(index + deleteCount);
            // New length is the previous length + addition count - deletion count
            this.values_.length += newItems.length - deleteCount;
            for(var i = 0; i < newItems.length; i++)this.values_[index + i] = newItems[i];
            for(var _i = 0; _i < oldItems.length; _i++)this.values_[index + newItems.length + _i] = oldItems[_i];
            return res;
        }
    };
    _proto.notifyArrayChildUpdate_ = function notifyArrayChildUpdate_(index, newValue, oldValue) {
        var notifySpy = !this.owned_ && isSpyEnabled();
        var notify = hasListeners(this);
        var change = notify || notifySpy ? {
            observableKind: "array",
            object: this.proxy_,
            type: UPDATE,
            debugObjectName: this.atom_.name_,
            index: index,
            newValue: newValue,
            oldValue: oldValue
        } : null;
        this.atom_.reportChanged();
        if (notify) notifyListeners(this, change);
    };
    _proto.notifyArraySplice_ = function notifyArraySplice_(index, added, removed) {
        var notifySpy = !this.owned_ && isSpyEnabled();
        var notify = hasListeners(this);
        var change = notify || notifySpy ? {
            observableKind: "array",
            object: this.proxy_,
            debugObjectName: this.atom_.name_,
            type: SPLICE,
            index: index,
            removed: removed,
            added: added,
            removedCount: removed.length,
            addedCount: added.length
        } : null;
        this.atom_.reportChanged();
        // conform: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/observe
        if (notify) notifyListeners(this, change);
    };
    _proto.get_ = function get_(index) {
        if (this.legacyMode_ && index >= this.values_.length) {
            console.warn("[mobx] Out of bounds read: " + index);
            return undefined;
        }
        this.atom_.reportObserved();
        return this.dehanceValue_(this.values_[index]);
    };
    _proto.set_ = function set_(index, newValue) {
        var values = this.values_;
        if (this.legacyMode_ && index > values.length) // out of bounds
        die(17, index, values.length);
        if (index < values.length) {
            // update at index in range
            checkIfStateModificationsAreAllowed(this.atom_);
            var oldValue = values[index];
            if (hasInterceptors(this)) {
                var change = interceptChange(this, {
                    type: UPDATE,
                    object: this.proxy_,
                    // since "this" is the real array we need to pass its proxy
                    index: index,
                    newValue: newValue
                });
                if (!change) return;
                newValue = change.newValue;
            }
            newValue = this.enhancer_(newValue, oldValue);
            var changed = newValue !== oldValue;
            if (changed) {
                values[index] = newValue;
                this.notifyArrayChildUpdate_(index, newValue, oldValue);
            }
        } else {
            // For out of bound index, we don't create an actual sparse array,
            // but rather fill the holes with undefined (same as setArrayLength_).
            // This could be considered a bug.
            var newItems = new Array(index + 1 - values.length);
            for(var i = 0; i < newItems.length - 1; i++)newItems[i] = undefined;
             // No Array.fill everywhere...
            newItems[newItems.length - 1] = newValue;
            this.spliceWithArray_(values.length, 0, newItems);
        }
    };
    return ObservableArrayAdministration;
}();
function createObservableArray(initialValues, enhancer, name, owned) {
    if (name === void 0) name = "ObservableArray";
    if (owned === void 0) owned = false;
    assertProxies();
    return initObservable(function() {
        var adm = new ObservableArrayAdministration(name, enhancer, owned, false);
        addHiddenFinalProp(adm.values_, $mobx, adm);
        var proxy = new Proxy(adm.values_, arrayTraps);
        adm.proxy_ = proxy;
        if (initialValues && initialValues.length) adm.spliceWithArray_(0, 0, initialValues);
        return proxy;
    });
}
// eslint-disable-next-line
var arrayExtensions = {
    clear: function clear() {
        return this.splice(0);
    },
    replace: function replace(newItems) {
        var adm = this[$mobx];
        return adm.spliceWithArray_(0, adm.values_.length, newItems);
    },
    // Used by JSON.stringify
    toJSON: function toJSON() {
        return this.slice();
    },
    /*
   * functions that do alter the internal structure of the array, (based on lib.es6.d.ts)
   * since these functions alter the inner structure of the array, the have side effects.
   * Because the have side effects, they should not be used in computed function,
   * and for that reason the do not call dependencyState.notifyObserved
   */ splice: function splice(index, deleteCount) {
        for(var _len = arguments.length, newItems = new Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++)newItems[_key - 2] = arguments[_key];
        var adm = this[$mobx];
        switch(arguments.length){
            case 0:
                return [];
            case 1:
                return adm.spliceWithArray_(index);
            case 2:
                return adm.spliceWithArray_(index, deleteCount);
        }
        return adm.spliceWithArray_(index, deleteCount, newItems);
    },
    spliceWithArray: function spliceWithArray(index, deleteCount, newItems) {
        return this[$mobx].spliceWithArray_(index, deleteCount, newItems);
    },
    push: function push() {
        var adm = this[$mobx];
        for(var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++)items[_key2] = arguments[_key2];
        adm.spliceWithArray_(adm.values_.length, 0, items);
        return adm.values_.length;
    },
    pop: function pop() {
        return this.splice(Math.max(this[$mobx].values_.length - 1, 0), 1)[0];
    },
    shift: function shift() {
        return this.splice(0, 1)[0];
    },
    unshift: function unshift() {
        var adm = this[$mobx];
        for(var _len3 = arguments.length, items = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++)items[_key3] = arguments[_key3];
        adm.spliceWithArray_(0, 0, items);
        return adm.values_.length;
    },
    reverse: function reverse() {
        // reverse by default mutates in place before returning the result
        // which makes it both a 'derivation' and a 'mutation'.
        if (globalState.trackingDerivation) die(37, "reverse");
        this.replace(this.slice().reverse());
        return this;
    },
    sort: function sort() {
        // sort by default mutates in place before returning the result
        // which goes against all good practices. Let's not change the array in place!
        if (globalState.trackingDerivation) die(37, "sort");
        var copy = this.slice();
        copy.sort.apply(copy, arguments);
        this.replace(copy);
        return this;
    },
    remove: function remove(value) {
        var adm = this[$mobx];
        var idx = adm.dehanceValues_(adm.values_).indexOf(value);
        if (idx > -1) {
            this.splice(idx, 1);
            return true;
        }
        return false;
    }
};
/**
 * Wrap function from prototype
 * Without this, everything works as well, but this works
 * faster as everything works on unproxied values
 */ addArrayExtension("at", simpleFunc);
addArrayExtension("concat", simpleFunc);
addArrayExtension("flat", simpleFunc);
addArrayExtension("includes", simpleFunc);
addArrayExtension("indexOf", simpleFunc);
addArrayExtension("join", simpleFunc);
addArrayExtension("lastIndexOf", simpleFunc);
addArrayExtension("slice", simpleFunc);
addArrayExtension("toString", simpleFunc);
addArrayExtension("toLocaleString", simpleFunc);
addArrayExtension("toSorted", simpleFunc);
addArrayExtension("toSpliced", simpleFunc);
addArrayExtension("with", simpleFunc);
// map
addArrayExtension("every", mapLikeFunc);
addArrayExtension("filter", mapLikeFunc);
addArrayExtension("find", mapLikeFunc);
addArrayExtension("findIndex", mapLikeFunc);
addArrayExtension("findLast", mapLikeFunc);
addArrayExtension("findLastIndex", mapLikeFunc);
addArrayExtension("flatMap", mapLikeFunc);
addArrayExtension("forEach", mapLikeFunc);
addArrayExtension("map", mapLikeFunc);
addArrayExtension("some", mapLikeFunc);
addArrayExtension("toReversed", mapLikeFunc);
// reduce
addArrayExtension("reduce", reduceLikeFunc);
addArrayExtension("reduceRight", reduceLikeFunc);
function addArrayExtension(funcName, funcFactory) {
    if (typeof Array.prototype[funcName] === "function") arrayExtensions[funcName] = funcFactory(funcName);
}
// Report and delegate to dehanced array
function simpleFunc(funcName) {
    return function() {
        var adm = this[$mobx];
        adm.atom_.reportObserved();
        var dehancedValues = adm.dehanceValues_(adm.values_);
        return dehancedValues[funcName].apply(dehancedValues, arguments);
    };
}
// Make sure callbacks receive correct array arg #2326
function mapLikeFunc(funcName) {
    return function(callback, thisArg) {
        var _this2 = this;
        var adm = this[$mobx];
        adm.atom_.reportObserved();
        var dehancedValues = adm.dehanceValues_(adm.values_);
        return dehancedValues[funcName](function(element, index) {
            return callback.call(thisArg, element, index, _this2);
        });
    };
}
// Make sure callbacks receive correct array arg #2326
function reduceLikeFunc(funcName) {
    return function() {
        var _this3 = this;
        var adm = this[$mobx];
        adm.atom_.reportObserved();
        var dehancedValues = adm.dehanceValues_(adm.values_);
        // #2432 - reduce behavior depends on arguments.length
        var callback = arguments[0];
        arguments[0] = function(accumulator, currentValue, index) {
            return callback(accumulator, currentValue, index, _this3);
        };
        return dehancedValues[funcName].apply(dehancedValues, arguments);
    };
}
var isObservableArrayAdministration = /*#__PURE__*/ createInstanceofPredicate("ObservableArrayAdministration", ObservableArrayAdministration);
function isObservableArray(thing) {
    return isObject(thing) && isObservableArrayAdministration(thing[$mobx]);
}
var ObservableMapMarker = {};
var ADD = "add";
var DELETE = "delete";
// just extend Map? See also https://gist.github.com/nestharus/13b4d74f2ef4a2f4357dbd3fc23c1e54
// But: https://github.com/mobxjs/mobx/issues/1556
var ObservableMap = /*#__PURE__*/ function() {
    function ObservableMap(initialData, enhancer_, name_) {
        var _this = this;
        if (enhancer_ === void 0) enhancer_ = deepEnhancer;
        if (name_ === void 0) name_ = "ObservableMap";
        this.enhancer_ = void 0;
        this.name_ = void 0;
        this[$mobx] = ObservableMapMarker;
        this.data_ = void 0;
        this.hasMap_ = void 0;
        // hasMap, not hashMap >-).
        this.keysAtom_ = void 0;
        this.interceptors_ = void 0;
        this.changeListeners_ = void 0;
        this.dehancer = void 0;
        this.enhancer_ = enhancer_;
        this.name_ = name_;
        if (!isFunction(Map)) die(18);
        initObservable(function() {
            _this.keysAtom_ = createAtom("ObservableMap.keys()");
            _this.data_ = new Map();
            _this.hasMap_ = new Map();
            if (initialData) _this.merge(initialData);
        });
    }
    var _proto = ObservableMap.prototype;
    _proto.has_ = function has_(key) {
        return this.data_.has(key);
    };
    _proto.has = function has(key) {
        var _this2 = this;
        if (!globalState.trackingDerivation) return this.has_(key);
        var entry = this.hasMap_.get(key);
        if (!entry) {
            var newEntry = entry = new ObservableValue(this.has_(key), referenceEnhancer, "ObservableMap.key?", false);
            this.hasMap_.set(key, newEntry);
            onBecomeUnobserved(newEntry, function() {
                return _this2.hasMap_["delete"](key);
            });
        }
        return entry.get();
    };
    _proto.set = function set(key, value) {
        var hasKey = this.has_(key);
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: hasKey ? UPDATE : ADD,
                object: this,
                newValue: value,
                name: key
            });
            if (!change) return this;
            value = change.newValue;
        }
        if (hasKey) this.updateValue_(key, value);
        else this.addValue_(key, value);
        return this;
    };
    _proto["delete"] = function _delete(key) {
        var _this3 = this;
        checkIfStateModificationsAreAllowed(this.keysAtom_);
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: DELETE,
                object: this,
                name: key
            });
            if (!change) return false;
        }
        if (this.has_(key)) {
            var notifySpy = isSpyEnabled();
            var notify = hasListeners(this);
            var _change = notify || notifySpy ? {
                observableKind: "map",
                debugObjectName: this.name_,
                type: DELETE,
                object: this,
                oldValue: this.data_.get(key).value_,
                name: key
            } : null;
            transaction(function() {
                var _this3$hasMap_$get;
                _this3.keysAtom_.reportChanged();
                (_this3$hasMap_$get = _this3.hasMap_.get(key)) == null || _this3$hasMap_$get.setNewValue_(false);
                var observable = _this3.data_.get(key);
                observable.setNewValue_(undefined);
                _this3.data_["delete"](key);
            });
            if (notify) notifyListeners(this, _change);
            return true;
        }
        return false;
    };
    _proto.updateValue_ = function updateValue_(key, newValue) {
        var observable = this.data_.get(key);
        newValue = observable.prepareNewValue_(newValue);
        if (newValue !== globalState.UNCHANGED) {
            var notifySpy = isSpyEnabled();
            var notify = hasListeners(this);
            var change = notify || notifySpy ? {
                observableKind: "map",
                debugObjectName: this.name_,
                type: UPDATE,
                object: this,
                oldValue: observable.value_,
                name: key,
                newValue: newValue
            } : null;
            observable.setNewValue_(newValue);
            if (notify) notifyListeners(this, change);
        }
    };
    _proto.addValue_ = function addValue_(key, newValue) {
        var _this4 = this;
        checkIfStateModificationsAreAllowed(this.keysAtom_);
        transaction(function() {
            var _this4$hasMap_$get;
            var observable = new ObservableValue(newValue, _this4.enhancer_, "ObservableMap.key", false);
            _this4.data_.set(key, observable);
            newValue = observable.value_; // value might have been changed
            (_this4$hasMap_$get = _this4.hasMap_.get(key)) == null || _this4$hasMap_$get.setNewValue_(true);
            _this4.keysAtom_.reportChanged();
        });
        var notifySpy = isSpyEnabled();
        var notify = hasListeners(this);
        var change = notify || notifySpy ? {
            observableKind: "map",
            debugObjectName: this.name_,
            type: ADD,
            object: this,
            name: key,
            newValue: newValue
        } : null;
        if (notify) notifyListeners(this, change);
    };
    _proto.get = function get(key) {
        if (this.has(key)) return this.dehanceValue_(this.data_.get(key).get());
        return this.dehanceValue_(undefined);
    };
    _proto.dehanceValue_ = function dehanceValue_(value) {
        if (this.dehancer !== undefined) return this.dehancer(value);
        return value;
    };
    _proto.keys = function keys() {
        this.keysAtom_.reportObserved();
        return this.data_.keys();
    };
    _proto.values = function values() {
        var self1 = this;
        var keys = this.keys();
        return makeIterable({
            next: function next() {
                var _keys$next = keys.next(), done = _keys$next.done, value = _keys$next.value;
                return {
                    done: done,
                    value: done ? undefined : self1.get(value)
                };
            }
        });
    };
    _proto.entries = function entries() {
        var self1 = this;
        var keys = this.keys();
        return makeIterable({
            next: function next() {
                var _keys$next2 = keys.next(), done = _keys$next2.done, value = _keys$next2.value;
                return {
                    done: done,
                    value: done ? undefined : [
                        value,
                        self1.get(value)
                    ]
                };
            }
        });
    };
    _proto[Symbol.iterator] = function() {
        return this.entries();
    };
    _proto.forEach = function forEach(callback, thisArg) {
        for(var _iterator = _createForOfIteratorHelperLoose(this), _step; !(_step = _iterator()).done;){
            var _step$value = _step.value, key = _step$value[0], value = _step$value[1];
            callback.call(thisArg, value, key, this);
        }
    } /** Merge another object into this object, returns this. */ ;
    _proto.merge = function merge(other) {
        var _this5 = this;
        if (isObservableMap(other)) other = new Map(other);
        transaction(function() {
            if (isPlainObject(other)) getPlainObjectKeys(other).forEach(function(key) {
                return _this5.set(key, other[key]);
            });
            else if (Array.isArray(other)) other.forEach(function(_ref) {
                var key = _ref[0], value = _ref[1];
                return _this5.set(key, value);
            });
            else if (isES6Map(other)) {
                if (!isPlainES6Map(other)) die(19, other);
                other.forEach(function(value, key) {
                    return _this5.set(key, value);
                });
            } else if (other !== null && other !== undefined) die(20, other);
        });
        return this;
    };
    _proto.clear = function clear() {
        var _this6 = this;
        transaction(function() {
            untracked(function() {
                for(var _iterator2 = _createForOfIteratorHelperLoose(_this6.keys()), _step2; !(_step2 = _iterator2()).done;){
                    var key = _step2.value;
                    _this6["delete"](key);
                }
            });
        });
    };
    _proto.replace = function replace(values) {
        var _this7 = this;
        // Implementation requirements:
        // - respect ordering of replacement map
        // - allow interceptors to run and potentially prevent individual operations
        // - don't recreate observables that already exist in original map (so we don't destroy existing subscriptions)
        // - don't _keysAtom.reportChanged if the keys of resulting map are indentical (order matters!)
        // - note that result map may differ from replacement map due to the interceptors
        transaction(function() {
            // Convert to map so we can do quick key lookups
            var replacementMap = convertToMap(values);
            var orderedData = new Map();
            // Used for optimization
            var keysReportChangedCalled = false;
            // Delete keys that don't exist in replacement map
            // if the key deletion is prevented by interceptor
            // add entry at the beginning of the result map
            for(var _iterator3 = _createForOfIteratorHelperLoose(_this7.data_.keys()), _step3; !(_step3 = _iterator3()).done;){
                var key = _step3.value;
                // Concurrently iterating/deleting keys
                // iterator should handle this correctly
                if (!replacementMap.has(key)) {
                    var deleted = _this7["delete"](key);
                    // Was the key removed?
                    if (deleted) // _keysAtom.reportChanged() was already called
                    keysReportChangedCalled = true;
                    else {
                        // Delete prevented by interceptor
                        var value = _this7.data_.get(key);
                        orderedData.set(key, value);
                    }
                }
            }
            // Merge entries
            for(var _iterator4 = _createForOfIteratorHelperLoose(replacementMap.entries()), _step4; !(_step4 = _iterator4()).done;){
                var _step4$value = _step4.value, _key = _step4$value[0], _value = _step4$value[1];
                // We will want to know whether a new key is added
                var keyExisted = _this7.data_.has(_key);
                // Add or update value
                _this7.set(_key, _value);
                // The addition could have been prevent by interceptor
                if (_this7.data_.has(_key)) {
                    // The update could have been prevented by interceptor
                    // and also we want to preserve existing values
                    // so use value from _data map (instead of replacement map)
                    var _value2 = _this7.data_.get(_key);
                    orderedData.set(_key, _value2);
                    // Was a new key added?
                    if (!keyExisted) // _keysAtom.reportChanged() was already called
                    keysReportChangedCalled = true;
                }
            }
            // Check for possible key order change
            if (!keysReportChangedCalled) {
                if (_this7.data_.size !== orderedData.size) // If size differs, keys are definitely modified
                _this7.keysAtom_.reportChanged();
                else {
                    var iter1 = _this7.data_.keys();
                    var iter2 = orderedData.keys();
                    var next1 = iter1.next();
                    var next2 = iter2.next();
                    while(!next1.done){
                        if (next1.value !== next2.value) {
                            _this7.keysAtom_.reportChanged();
                            break;
                        }
                        next1 = iter1.next();
                        next2 = iter2.next();
                    }
                }
            }
            // Use correctly ordered map
            _this7.data_ = orderedData;
        });
        return this;
    };
    _proto.toString = function toString() {
        return "[object ObservableMap]";
    };
    _proto.toJSON = function toJSON() {
        return Array.from(this);
    };
    /**
   * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
   * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
   * for callback details
   */ _proto.observe_ = function observe_(listener, fireImmediately) {
        return registerListener(this, listener);
    };
    _proto.intercept_ = function intercept_(handler) {
        return registerInterceptor(this, handler);
    };
    return _createClass(ObservableMap, [
        {
            key: "size",
            get: function get() {
                this.keysAtom_.reportObserved();
                return this.data_.size;
            }
        },
        {
            key: Symbol.toStringTag,
            get: function get() {
                return "Map";
            }
        }
    ]);
}();
// eslint-disable-next-line
var isObservableMap = /*#__PURE__*/ createInstanceofPredicate("ObservableMap", ObservableMap);
function convertToMap(dataStructure) {
    if (isES6Map(dataStructure) || isObservableMap(dataStructure)) return dataStructure;
    else if (Array.isArray(dataStructure)) return new Map(dataStructure);
    else if (isPlainObject(dataStructure)) {
        var map = new Map();
        for(var key in dataStructure)map.set(key, dataStructure[key]);
        return map;
    } else return die(21, dataStructure);
}
var ObservableSetMarker = {};
var ObservableSet = /*#__PURE__*/ function() {
    function ObservableSet(initialData, enhancer, name_) {
        var _this = this;
        if (enhancer === void 0) enhancer = deepEnhancer;
        if (name_ === void 0) name_ = "ObservableSet";
        this.name_ = void 0;
        this[$mobx] = ObservableSetMarker;
        this.data_ = new Set();
        this.atom_ = void 0;
        this.changeListeners_ = void 0;
        this.interceptors_ = void 0;
        this.dehancer = void 0;
        this.enhancer_ = void 0;
        this.name_ = name_;
        if (!isFunction(Set)) die(22);
        this.enhancer_ = function(newV, oldV) {
            return enhancer(newV, oldV, name_);
        };
        initObservable(function() {
            _this.atom_ = createAtom(_this.name_);
            if (initialData) _this.replace(initialData);
        });
    }
    var _proto = ObservableSet.prototype;
    _proto.dehanceValue_ = function dehanceValue_(value) {
        if (this.dehancer !== undefined) return this.dehancer(value);
        return value;
    };
    _proto.clear = function clear() {
        var _this2 = this;
        transaction(function() {
            untracked(function() {
                for(var _iterator = _createForOfIteratorHelperLoose(_this2.data_.values()), _step; !(_step = _iterator()).done;){
                    var value = _step.value;
                    _this2["delete"](value);
                }
            });
        });
    };
    _proto.forEach = function forEach(callbackFn, thisArg) {
        for(var _iterator2 = _createForOfIteratorHelperLoose(this), _step2; !(_step2 = _iterator2()).done;){
            var value = _step2.value;
            callbackFn.call(thisArg, value, value, this);
        }
    };
    _proto.add = function add(value) {
        var _this3 = this;
        checkIfStateModificationsAreAllowed(this.atom_);
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: ADD,
                object: this,
                newValue: value
            });
            if (!change) return this;
        // ideally, value = change.value would be done here, so that values can be
        // changed by interceptor. Same applies for other Set and Map api's.
        }
        if (!this.has(value)) {
            transaction(function() {
                _this3.data_.add(_this3.enhancer_(value, undefined));
                _this3.atom_.reportChanged();
            });
            var notifySpy = false;
            var notify = hasListeners(this);
            var _change = notify || notifySpy ? {
                observableKind: "set",
                debugObjectName: this.name_,
                type: ADD,
                object: this,
                newValue: value
            } : null;
            if (notify) notifyListeners(this, _change);
        }
        return this;
    };
    _proto["delete"] = function _delete(value) {
        var _this4 = this;
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: DELETE,
                object: this,
                oldValue: value
            });
            if (!change) return false;
        }
        if (this.has(value)) {
            var notifySpy = false;
            var notify = hasListeners(this);
            var _change2 = notify || notifySpy ? {
                observableKind: "set",
                debugObjectName: this.name_,
                type: DELETE,
                object: this,
                oldValue: value
            } : null;
            transaction(function() {
                _this4.atom_.reportChanged();
                _this4.data_["delete"](value);
            });
            if (notify) notifyListeners(this, _change2);
            return true;
        }
        return false;
    };
    _proto.has = function has(value) {
        this.atom_.reportObserved();
        return this.data_.has(this.dehanceValue_(value));
    };
    _proto.entries = function entries() {
        var nextIndex = 0;
        var keys = Array.from(this.keys());
        var values = Array.from(this.values());
        return makeIterable({
            next: function next() {
                var index = nextIndex;
                nextIndex += 1;
                return index < values.length ? {
                    value: [
                        keys[index],
                        values[index]
                    ],
                    done: false
                } : {
                    done: true
                };
            }
        });
    };
    _proto.keys = function keys() {
        return this.values();
    };
    _proto.values = function values() {
        this.atom_.reportObserved();
        var self1 = this;
        var nextIndex = 0;
        var observableValues = Array.from(this.data_.values());
        return makeIterable({
            next: function next() {
                return nextIndex < observableValues.length ? {
                    value: self1.dehanceValue_(observableValues[nextIndex++]),
                    done: false
                } : {
                    done: true
                };
            }
        });
    };
    _proto.intersection = function intersection(otherSet) {
        if (isES6Set(otherSet) && !isObservableSet(otherSet)) return otherSet.intersection(this);
        else {
            var dehancedSet = new Set(this);
            return dehancedSet.intersection(otherSet);
        }
    };
    _proto.union = function union(otherSet) {
        if (isES6Set(otherSet) && !isObservableSet(otherSet)) return otherSet.union(this);
        else {
            var dehancedSet = new Set(this);
            return dehancedSet.union(otherSet);
        }
    };
    _proto.difference = function difference(otherSet) {
        return new Set(this).difference(otherSet);
    };
    _proto.symmetricDifference = function symmetricDifference(otherSet) {
        if (isES6Set(otherSet) && !isObservableSet(otherSet)) return otherSet.symmetricDifference(this);
        else {
            var dehancedSet = new Set(this);
            return dehancedSet.symmetricDifference(otherSet);
        }
    };
    _proto.isSubsetOf = function isSubsetOf(otherSet) {
        return new Set(this).isSubsetOf(otherSet);
    };
    _proto.isSupersetOf = function isSupersetOf(otherSet) {
        return new Set(this).isSupersetOf(otherSet);
    };
    _proto.isDisjointFrom = function isDisjointFrom(otherSet) {
        if (isES6Set(otherSet) && !isObservableSet(otherSet)) return otherSet.isDisjointFrom(this);
        else {
            var dehancedSet = new Set(this);
            return dehancedSet.isDisjointFrom(otherSet);
        }
    };
    _proto.replace = function replace(other) {
        var _this5 = this;
        if (isObservableSet(other)) other = new Set(other);
        transaction(function() {
            if (Array.isArray(other)) {
                _this5.clear();
                other.forEach(function(value) {
                    return _this5.add(value);
                });
            } else if (isES6Set(other)) {
                _this5.clear();
                other.forEach(function(value) {
                    return _this5.add(value);
                });
            } else if (other !== null && other !== undefined) die("Cannot initialize set from " + other);
        });
        return this;
    };
    _proto.observe_ = function observe_(listener, fireImmediately) {
        return registerListener(this, listener);
    };
    _proto.intercept_ = function intercept_(handler) {
        return registerInterceptor(this, handler);
    };
    _proto.toJSON = function toJSON() {
        return Array.from(this);
    };
    _proto.toString = function toString() {
        return "[object ObservableSet]";
    };
    _proto[Symbol.iterator] = function() {
        return this.values();
    };
    return _createClass(ObservableSet, [
        {
            key: "size",
            get: function get() {
                this.atom_.reportObserved();
                return this.data_.size;
            }
        },
        {
            key: Symbol.toStringTag,
            get: function get() {
                return "Set";
            }
        }
    ]);
}();
// eslint-disable-next-line
var isObservableSet = /*#__PURE__*/ createInstanceofPredicate("ObservableSet", ObservableSet);
var descriptorCache = /*#__PURE__*/ Object.create(null);
var REMOVE = "remove";
var ObservableObjectAdministration = /*#__PURE__*/ function() {
    function ObservableObjectAdministration(target_, values_, name_, // Used anytime annotation is not explicitely provided
    defaultAnnotation_) {
        if (values_ === void 0) values_ = new Map();
        if (defaultAnnotation_ === void 0) defaultAnnotation_ = autoAnnotation;
        this.target_ = void 0;
        this.values_ = void 0;
        this.name_ = void 0;
        this.defaultAnnotation_ = void 0;
        this.keysAtom_ = void 0;
        this.changeListeners_ = void 0;
        this.interceptors_ = void 0;
        this.proxy_ = void 0;
        this.isPlainObject_ = void 0;
        this.appliedAnnotations_ = void 0;
        this.pendingKeys_ = void 0;
        this.target_ = target_;
        this.values_ = values_;
        this.name_ = name_;
        this.defaultAnnotation_ = defaultAnnotation_;
        this.keysAtom_ = new Atom("ObservableObject.keys");
        // Optimization: we use this frequently
        this.isPlainObject_ = isPlainObject(this.target_);
    }
    var _proto = ObservableObjectAdministration.prototype;
    _proto.getObservablePropValue_ = function getObservablePropValue_(key) {
        return this.values_.get(key).get();
    };
    _proto.setObservablePropValue_ = function setObservablePropValue_(key, newValue) {
        var observable = this.values_.get(key);
        if (observable instanceof ComputedValue) {
            observable.set(newValue);
            return true;
        }
        // intercept
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                type: UPDATE,
                object: this.proxy_ || this.target_,
                name: key,
                newValue: newValue
            });
            if (!change) return null;
            newValue = change.newValue;
        }
        newValue = observable.prepareNewValue_(newValue);
        // notify spy & observers
        if (newValue !== globalState.UNCHANGED) {
            var notify = hasListeners(this);
            var notifySpy = false;
            var _change = notify || notifySpy ? {
                type: UPDATE,
                observableKind: "object",
                debugObjectName: this.name_,
                object: this.proxy_ || this.target_,
                oldValue: observable.value_,
                name: key,
                newValue: newValue
            } : null;
            observable.setNewValue_(newValue);
            if (notify) notifyListeners(this, _change);
        }
        return true;
    };
    _proto.get_ = function get_(key) {
        if (globalState.trackingDerivation && !hasProp(this.target_, key)) // Key doesn't exist yet, subscribe for it in case it's added later
        this.has_(key);
        return this.target_[key];
    } /**
   * @param {PropertyKey} key
   * @param {any} value
   * @param {Annotation|boolean} annotation true - use default annotation, false - copy as is
   * @param {boolean} proxyTrap whether it's called from proxy trap
   * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
   */ ;
    _proto.set_ = function set_(key, value, proxyTrap) {
        if (proxyTrap === void 0) proxyTrap = false;
        // Don't use .has(key) - we care about own
        if (hasProp(this.target_, key)) {
            // Existing prop
            if (this.values_.has(key)) // Observable (can be intercepted)
            return this.setObservablePropValue_(key, value);
            else if (proxyTrap) // Non-observable - proxy
            return Reflect.set(this.target_, key, value);
            else {
                // Non-observable
                this.target_[key] = value;
                return true;
            }
        } else // New prop
        return this.extend_(key, {
            value: value,
            enumerable: true,
            writable: true,
            configurable: true
        }, this.defaultAnnotation_, proxyTrap);
    };
    _proto.has_ = function has_(key) {
        if (!globalState.trackingDerivation) // Skip key subscription outside derivation
        return key in this.target_;
        this.pendingKeys_ || (this.pendingKeys_ = new Map());
        var entry = this.pendingKeys_.get(key);
        if (!entry) {
            entry = new ObservableValue(key in this.target_, referenceEnhancer, "ObservableObject.key?", false);
            this.pendingKeys_.set(key, entry);
        }
        return entry.get();
    } /**
   * @param {PropertyKey} key
   * @param {Annotation|boolean} annotation true - use default annotation, false - ignore prop
   */ ;
    _proto.make_ = function make_(key, annotation) {
        if (annotation === true) annotation = this.defaultAnnotation_;
        if (annotation === false) return;
        assertAnnotable(this, annotation, key);
        if (!(key in this.target_)) {
            var _this$target_$storedA;
            // Throw on missing key, except for decorators:
            // Decorator annotations are collected from whole prototype chain.
            // When called from super() some props may not exist yet.
            // However we don't have to worry about missing prop,
            // because the decorator must have been applied to something.
            if ((_this$target_$storedA = this.target_[storedAnnotationsSymbol]) != null && _this$target_$storedA[key]) return; // will be annotated by subclass constructor
            else die(1, annotation.annotationType_, this.name_ + "." + key.toString());
        }
        var source = this.target_;
        while(source && source !== objectPrototype){
            var descriptor = getDescriptor(source, key);
            if (descriptor) {
                var outcome = annotation.make_(this, key, descriptor, source);
                if (outcome === 0 /* MakeResult.Cancel */ ) return;
                if (outcome === 1 /* MakeResult.Break */ ) break;
            }
            source = Object.getPrototypeOf(source);
        }
        recordAnnotationApplied(this, annotation, key);
    } /**
   * @param {PropertyKey} key
   * @param {PropertyDescriptor} descriptor
   * @param {Annotation|boolean} annotation true - use default annotation, false - copy as is
   * @param {boolean} proxyTrap whether it's called from proxy trap
   * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
   */ ;
    _proto.extend_ = function extend_(key, descriptor, annotation, proxyTrap) {
        if (proxyTrap === void 0) proxyTrap = false;
        if (annotation === true) annotation = this.defaultAnnotation_;
        if (annotation === false) return this.defineProperty_(key, descriptor, proxyTrap);
        assertAnnotable(this, annotation, key);
        var outcome = annotation.extend_(this, key, descriptor, proxyTrap);
        if (outcome) recordAnnotationApplied(this, annotation, key);
        return outcome;
    } /**
   * @param {PropertyKey} key
   * @param {PropertyDescriptor} descriptor
   * @param {boolean} proxyTrap whether it's called from proxy trap
   * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
   */ ;
    _proto.defineProperty_ = function defineProperty_(key, descriptor, proxyTrap) {
        if (proxyTrap === void 0) proxyTrap = false;
        checkIfStateModificationsAreAllowed(this.keysAtom_);
        try {
            startBatch();
            // Delete
            var deleteOutcome = this.delete_(key);
            if (!deleteOutcome) // Failure or intercepted
            return deleteOutcome;
            // ADD interceptor
            if (hasInterceptors(this)) {
                var change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: descriptor.value
                });
                if (!change) return null;
                var newValue = change.newValue;
                if (descriptor.value !== newValue) descriptor = _extends({}, descriptor, {
                    value: newValue
                });
            }
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) return false;
            } else defineProperty(this.target_, key, descriptor);
            // Notify
            this.notifyPropertyAddition_(key, descriptor.value);
        } finally{
            endBatch();
        }
        return true;
    };
    _proto.defineObservableProperty_ = function defineObservableProperty_(key, value, enhancer, proxyTrap) {
        if (proxyTrap === void 0) proxyTrap = false;
        checkIfStateModificationsAreAllowed(this.keysAtom_);
        try {
            startBatch();
            // Delete
            var deleteOutcome = this.delete_(key);
            if (!deleteOutcome) // Failure or intercepted
            return deleteOutcome;
            // ADD interceptor
            if (hasInterceptors(this)) {
                var change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: value
                });
                if (!change) return null;
                value = change.newValue;
            }
            var cachedDescriptor = getCachedObservablePropDescriptor(key);
            var descriptor = {
                configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
                enumerable: true,
                get: cachedDescriptor.get,
                set: cachedDescriptor.set
            };
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) return false;
            } else defineProperty(this.target_, key, descriptor);
            var observable = new ObservableValue(value, enhancer, "ObservableObject.key", false);
            this.values_.set(key, observable);
            // Notify (value possibly changed by ObservableValue)
            this.notifyPropertyAddition_(key, observable.value_);
        } finally{
            endBatch();
        }
        return true;
    };
    _proto.defineComputedProperty_ = function defineComputedProperty_(key, options, proxyTrap) {
        if (proxyTrap === void 0) proxyTrap = false;
        checkIfStateModificationsAreAllowed(this.keysAtom_);
        try {
            startBatch();
            // Delete
            var deleteOutcome = this.delete_(key);
            if (!deleteOutcome) // Failure or intercepted
            return deleteOutcome;
            // ADD interceptor
            if (hasInterceptors(this)) {
                var change = interceptChange(this, {
                    object: this.proxy_ || this.target_,
                    name: key,
                    type: ADD,
                    newValue: undefined
                });
                if (!change) return null;
            }
            options.name || (options.name = "ObservableObject.key");
            options.context = this.proxy_ || this.target_;
            var cachedDescriptor = getCachedObservablePropDescriptor(key);
            var descriptor = {
                configurable: globalState.safeDescriptors ? this.isPlainObject_ : true,
                enumerable: false,
                get: cachedDescriptor.get,
                set: cachedDescriptor.set
            };
            // Define
            if (proxyTrap) {
                if (!Reflect.defineProperty(this.target_, key, descriptor)) return false;
            } else defineProperty(this.target_, key, descriptor);
            this.values_.set(key, new ComputedValue(options));
            // Notify
            this.notifyPropertyAddition_(key, undefined);
        } finally{
            endBatch();
        }
        return true;
    } /**
   * @param {PropertyKey} key
   * @param {PropertyDescriptor} descriptor
   * @param {boolean} proxyTrap whether it's called from proxy trap
   * @returns {boolean|null} true on success, false on failure (proxyTrap + non-configurable), null when cancelled by interceptor
   */ ;
    _proto.delete_ = function delete_(key, proxyTrap) {
        if (proxyTrap === void 0) proxyTrap = false;
        checkIfStateModificationsAreAllowed(this.keysAtom_);
        // No such prop
        if (!hasProp(this.target_, key)) return true;
        // Intercept
        if (hasInterceptors(this)) {
            var change = interceptChange(this, {
                object: this.proxy_ || this.target_,
                name: key,
                type: REMOVE
            });
            // Cancelled
            if (!change) return null;
        }
        // Delete
        try {
            var _this$pendingKeys_;
            startBatch();
            var notify = hasListeners(this);
            var notifySpy = false;
            var observable = this.values_.get(key);
            // Value needed for spies/listeners
            var value = undefined;
            // Optimization: don't pull the value unless we will need it
            if (!observable && (notify || notifySpy)) {
                var _getDescriptor;
                value = (_getDescriptor = getDescriptor(this.target_, key)) == null ? void 0 : _getDescriptor.value;
            }
            // delete prop (do first, may fail)
            if (proxyTrap) {
                if (!Reflect.deleteProperty(this.target_, key)) return false;
            } else delete this.target_[key];
            // Clear observable
            if (observable) {
                this.values_["delete"](key);
                // for computed, value is undefined
                if (observable instanceof ObservableValue) value = observable.value_;
                // Notify: autorun(() => obj[key]), see #1796
                propagateChanged(observable);
            }
            // Notify "keys/entries/values" observers
            this.keysAtom_.reportChanged();
            // Notify "has" observers
            // "in" as it may still exist in proto
            (_this$pendingKeys_ = this.pendingKeys_) == null || (_this$pendingKeys_ = _this$pendingKeys_.get(key)) == null || _this$pendingKeys_.set(key in this.target_);
            // Notify spies/listeners
            if (notify || notifySpy) {
                var _change2 = {
                    type: REMOVE,
                    observableKind: "object",
                    object: this.proxy_ || this.target_,
                    debugObjectName: this.name_,
                    oldValue: value,
                    name: key
                };
                if (notify) notifyListeners(this, _change2);
            }
        } finally{
            endBatch();
        }
        return true;
    } /**
   * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
   * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
   * for callback details
   */ ;
    _proto.observe_ = function observe_(callback, fireImmediately) {
        return registerListener(this, callback);
    };
    _proto.intercept_ = function intercept_(handler) {
        return registerInterceptor(this, handler);
    };
    _proto.notifyPropertyAddition_ = function notifyPropertyAddition_(key, value) {
        var _this$pendingKeys_2;
        var notify = hasListeners(this);
        var notifySpy = false;
        if (notify || notifySpy) {
            var change = notify || notifySpy ? {
                type: ADD,
                observableKind: "object",
                debugObjectName: this.name_,
                object: this.proxy_ || this.target_,
                name: key,
                newValue: value
            } : null;
            if (notify) notifyListeners(this, change);
        }
        (_this$pendingKeys_2 = this.pendingKeys_) == null || (_this$pendingKeys_2 = _this$pendingKeys_2.get(key)) == null || _this$pendingKeys_2.set(true);
        // Notify "keys/entries/values" observers
        this.keysAtom_.reportChanged();
    };
    _proto.ownKeys_ = function ownKeys_() {
        this.keysAtom_.reportObserved();
        return ownKeys(this.target_);
    };
    _proto.keys_ = function keys_() {
        // Returns enumerable && own, but unfortunately keysAtom will report on ANY key change.
        // There is no way to distinguish between Object.keys(object) and Reflect.ownKeys(object) - both are handled by ownKeys trap.
        // We can either over-report in Object.keys(object) or under-report in Reflect.ownKeys(object)
        // We choose to over-report in Object.keys(object), because:
        // - typically it's used with simple data objects
        // - when symbolic/non-enumerable keys are relevant Reflect.ownKeys works as expected
        this.keysAtom_.reportObserved();
        return Object.keys(this.target_);
    };
    return ObservableObjectAdministration;
}();
function asObservableObject(target, options) {
    var _options$name;
    if (hasProp(target, $mobx)) return target;
    var name = (_options$name = options == null ? void 0 : options.name) != null ? _options$name : "ObservableObject";
    var adm = new ObservableObjectAdministration(target, new Map(), String(name), getAnnotationFromOptions(options));
    addHiddenProp(target, $mobx, adm);
    return target;
}
var isObservableObjectAdministration = /*#__PURE__*/ createInstanceofPredicate("ObservableObjectAdministration", ObservableObjectAdministration);
function getCachedObservablePropDescriptor(key) {
    return descriptorCache[key] || (descriptorCache[key] = {
        get: function get() {
            return this[$mobx].getObservablePropValue_(key);
        },
        set: function set(value) {
            return this[$mobx].setObservablePropValue_(key, value);
        }
    });
}
function isObservableObject(thing) {
    if (isObject(thing)) return isObservableObjectAdministration(thing[$mobx]);
    return false;
}
function recordAnnotationApplied(adm, annotation, key) {
    var _adm$target_$storedAn;
    // Remove applied decorator annotation so we don't try to apply it again in subclass constructor
    (_adm$target_$storedAn = adm.target_[storedAnnotationsSymbol]) == null || delete _adm$target_$storedAn[key];
}
function assertAnnotable(adm, annotation, key) {
    var fieldName, currentAnnotationType, requestedAnnotationType;
}
// Bug in safari 9.* (or iOS 9 safari mobile). See #364
var ENTRY_0 = /*#__PURE__*/ createArrayEntryDescriptor(0);
var safariPrototypeSetterInheritanceBug = /*#__PURE__*/ function() {
    var v = false;
    var p = {};
    Object.defineProperty(p, "0", {
        set: function set() {
            v = true;
        }
    });
    /*#__PURE__*/ Object.create(p)["0"] = 1;
    return v === false;
}();
/**
 * This array buffer contains two lists of properties, so that all arrays
 * can recycle their property definitions, which significantly improves performance of creating
 * properties on the fly.
 */ var OBSERVABLE_ARRAY_BUFFER_SIZE = 0;
// Typescript workaround to make sure ObservableArray extends Array
var StubArray = function StubArray() {};
function inherit(ctor, proto) {
    if (Object.setPrototypeOf) Object.setPrototypeOf(ctor.prototype, proto);
    else if (ctor.prototype.__proto__ !== undefined) ctor.prototype.__proto__ = proto;
    else ctor.prototype = proto;
}
inherit(StubArray, Array.prototype);
// Weex proto freeze protection was here,
// but it is unclear why the hack is need as MobX never changed the prototype
// anyway, so removed it in V6
var LegacyObservableArray = /*#__PURE__*/ function(_StubArray) {
    function LegacyObservableArray(initialValues, enhancer, name, owned) {
        var _this;
        if (name === void 0) name = "ObservableArray";
        if (owned === void 0) owned = false;
        _this = _StubArray.call(this) || this;
        initObservable(function() {
            var adm = new ObservableArrayAdministration(name, enhancer, owned, true);
            adm.proxy_ = _this;
            addHiddenFinalProp(_this, $mobx, adm);
            if (initialValues && initialValues.length) // @ts-ignore
            _this.spliceWithArray(0, 0, initialValues);
            if (safariPrototypeSetterInheritanceBug) // Seems that Safari won't use numeric prototype setter until any * numeric property is
            // defined on the instance. After that it works fine, even if this property is deleted.
            Object.defineProperty(_this, "0", ENTRY_0);
        });
        return _this;
    }
    _inheritsLoose(LegacyObservableArray, _StubArray);
    var _proto = LegacyObservableArray.prototype;
    _proto.concat = function concat() {
        this[$mobx].atom_.reportObserved();
        for(var _len = arguments.length, arrays = new Array(_len), _key = 0; _key < _len; _key++)arrays[_key] = arguments[_key];
        return Array.prototype.concat.apply(this.slice(), //@ts-ignore
        arrays.map(function(a) {
            return isObservableArray(a) ? a.slice() : a;
        }));
    };
    _proto[Symbol.iterator] = function() {
        var self1 = this;
        var nextIndex = 0;
        return makeIterable({
            next: function next() {
                return nextIndex < self1.length ? {
                    value: self1[nextIndex++],
                    done: false
                } : {
                    done: true,
                    value: undefined
                };
            }
        });
    };
    return _createClass(LegacyObservableArray, [
        {
            key: "length",
            get: function get() {
                return this[$mobx].getArrayLength_();
            },
            set: function set(newLength) {
                this[$mobx].setArrayLength_(newLength);
            }
        },
        {
            key: Symbol.toStringTag,
            get: function get() {
                return "Array";
            }
        }
    ]);
}(StubArray);
Object.entries(arrayExtensions).forEach(function(_ref) {
    var prop = _ref[0], fn = _ref[1];
    if (prop !== "concat") addHiddenProp(LegacyObservableArray.prototype, prop, fn);
});
function createArrayEntryDescriptor(index) {
    return {
        enumerable: false,
        configurable: true,
        get: function get() {
            return this[$mobx].get_(index);
        },
        set: function set(value) {
            this[$mobx].set_(index, value);
        }
    };
}
function createArrayBufferItem(index) {
    defineProperty(LegacyObservableArray.prototype, "" + index, createArrayEntryDescriptor(index));
}
function reserveArrayBuffer(max) {
    if (max > OBSERVABLE_ARRAY_BUFFER_SIZE) {
        for(var index = OBSERVABLE_ARRAY_BUFFER_SIZE; index < max + 100; index++)createArrayBufferItem(index);
        OBSERVABLE_ARRAY_BUFFER_SIZE = max;
    }
}
reserveArrayBuffer(1000);
function createLegacyArray(initialValues, enhancer, name) {
    return new LegacyObservableArray(initialValues, enhancer, name);
}
function getAtom(thing, property) {
    if (typeof thing === "object" && thing !== null) {
        if (isObservableArray(thing)) {
            if (property !== undefined) die(23);
            return thing[$mobx].atom_;
        }
        if (isObservableSet(thing)) return thing.atom_;
        if (isObservableMap(thing)) {
            if (property === undefined) return thing.keysAtom_;
            var observable = thing.data_.get(property) || thing.hasMap_.get(property);
            if (!observable) die(25, property, getDebugName(thing));
            return observable;
        }
        if (isObservableObject(thing)) {
            if (!property) return die(26);
            var _observable = thing[$mobx].values_.get(property);
            if (!_observable) die(27, property, getDebugName(thing));
            return _observable;
        }
        if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) return thing;
    } else if (isFunction(thing)) {
        if (isReaction(thing[$mobx])) // disposer function
        return thing[$mobx];
    }
    die(28);
}
function getAdministration(thing, property) {
    if (!thing) die(29);
    if (property !== undefined) return getAdministration(getAtom(thing, property));
    if (isAtom(thing) || isComputedValue(thing) || isReaction(thing)) return thing;
    if (isObservableMap(thing) || isObservableSet(thing)) return thing;
    if (thing[$mobx]) return thing[$mobx];
    die(24, thing);
}
function getDebugName(thing, property) {
    var named;
    if (property !== undefined) named = getAtom(thing, property);
    else if (isAction(thing)) return thing.name;
    else if (isObservableObject(thing) || isObservableMap(thing) || isObservableSet(thing)) named = getAdministration(thing);
    else // valid for arrays as well
    named = getAtom(thing);
    return named.name_;
}
/**
 * Helper function for initializing observable structures, it applies:
 * 1. allowStateChanges so we don't violate enforceActions.
 * 2. untracked so we don't accidentaly subscribe to anything observable accessed during init in case the observable is created inside derivation.
 * 3. batch to avoid state version updates
 */ function initObservable(cb) {
    var derivation = untrackedStart();
    var allowStateChanges = allowStateChangesStart(true);
    startBatch();
    try {
        return cb();
    } finally{
        endBatch();
        allowStateChangesEnd(allowStateChanges);
        untrackedEnd(derivation);
    }
}
var toString = objectPrototype.toString;
function deepEqual(a, b, depth) {
    if (depth === void 0) depth = -1;
    return eq(a, b, depth);
}
// Copied from https://github.com/jashkenas/underscore/blob/5c237a7c682fb68fd5378203f0bf22dce1624854/underscore.js#L1186-L1289
// Internal recursive comparison function for `isEqual`.
function eq(a, b, depth, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // `null` or `undefined` only equal to itself (strict comparison).
    if (a == null || b == null) return false;
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b;
    // Exhaust primitive checks
    var type = typeof a;
    if (type !== "function" && type !== "object" && typeof b != "object") return false;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch(className){
        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
        case "[object RegExp]":
        // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
        case "[object String]":
            // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
            // equivalent to `new String("5")`.
            return "" + a === "" + b;
        case "[object Number]":
            // `NaN`s are equivalent, but non-reflexive.
            // Object(NaN) is equivalent to NaN.
            if (+a !== +a) return +b !== +b;
            // An `egal` comparison is performed for other numeric values.
            return +a === 0 ? 1 / +a === 1 / b : +a === +b;
        case "[object Date]":
        case "[object Boolean]":
            // Coerce dates and booleans to numeric primitive values. Dates are compared by their
            // millisecond representations. Note that invalid dates with millisecond representations
            // of `NaN` are not equivalent.
            return +a === +b;
        case "[object Symbol]":
            return typeof Symbol !== "undefined" && Symbol.valueOf.call(a) === Symbol.valueOf.call(b);
        case "[object Map]":
        case "[object Set]":
            // Maps and Sets are unwrapped to arrays of entry-pairs, adding an incidental level.
            // Hide this extra level by increasing the depth.
            if (depth >= 0) depth++;
            break;
    }
    // Unwrap any wrapped objects.
    a = unwrap(a);
    b = unwrap(b);
    var areArrays = className === "[object Array]";
    if (!areArrays) {
        if (typeof a != "object" || typeof b != "object") return false;
        // Objects with different constructors are not equivalent, but `Object`s or `Array`s
        // from different frames are.
        var aCtor = a.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && "constructor" in a && "constructor" in b) return false;
    }
    if (depth === 0) return false;
    else if (depth < 0) depth = -1;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while(length--){
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] === a) return bStack[length] === b;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    // Recursively compare objects and arrays.
    if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length;
        if (length !== b.length) return false;
        // Deep compare the contents, ignoring non-numeric properties.
        while(length--){
            if (!eq(a[length], b[length], depth - 1, aStack, bStack)) return false;
        }
    } else {
        // Deep compare objects.
        var keys = Object.keys(a);
        var key;
        length = keys.length;
        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (Object.keys(b).length !== length) return false;
        while(length--){
            // Deep compare each member
            key = keys[length];
            if (!(hasProp(b, key) && eq(a[key], b[key], depth - 1, aStack, bStack))) return false;
        }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
}
function unwrap(a) {
    if (isObservableArray(a)) return a.slice();
    if (isES6Map(a) || isObservableMap(a)) return Array.from(a.entries());
    if (isES6Set(a) || isObservableSet(a)) return Array.from(a.entries());
    return a;
}
function makeIterable(iterator) {
    iterator[Symbol.iterator] = getSelf;
    return iterator;
}
function getSelf() {
    return this;
}
function isAnnotation(thing) {
    return(// Can be function
    thing instanceof Object && typeof thing.annotationType_ === "string" && isFunction(thing.make_) && isFunction(thing.extend_));
}
/**
 * (c) Michel Weststrate 2015 - 2020
 * MIT Licensed
 *
 * Welcome to the mobx sources! To get a global overview of how MobX internally works,
 * this is a good place to start:
 * https://medium.com/@mweststrate/becoming-fully-reactive-an-in-depth-explanation-of-mobservable-55995262a254#.xvbh6qd74
 *
 * Source folders:
 * ===============
 *
 * - api/     Most of the public static methods exposed by the module can be found here.
 * - core/    Implementation of the MobX algorithm; atoms, derivations, reactions, dependency trees, optimizations. Cool stuff can be found here.
 * - types/   All the magic that is need to have observable objects, arrays and values is in this folder. Including the modifiers like `asFlat`.
 * - utils/   Utility stuff.
 *
 */ [
    "Symbol",
    "Map",
    "Set"
].forEach(function(m) {
    var g = getGlobal();
    if (typeof g[m] === "undefined") die("MobX requires global '" + m + "' to be available or polyfilled");
});
if (typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__ === "object") // See: https://github.com/andykog/mobx-devtools/
__MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({
    spy: spy,
    extras: {
        getDebugName: getDebugName
    },
    $mobx: $mobx
});
 //# sourceMappingURL=mobx.esm.js.map
}),
"577": (function (__unused_webpack_module, exports, __webpack_require__) {
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ /*
 Modernizr 3.0.0pre (Custom Build) | MIT
*/ 'use strict';
var aa = __webpack_require__("378"), ca = __webpack_require__("102");
function p(a) {
    for(var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++)b += "&args[]=" + encodeURIComponent(arguments[c]);
    return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
}
var da = new Set, ea = {};
function fa(a, b) {
    ha(a, b);
    ha(a + "Capture", b);
}
function ha(a, b) {
    ea[a] = b;
    for(a = 0; a < b.length; a++)da.add(b[a]);
}
var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
function oa(a) {
    if (ja.call(ma, a)) return !0;
    if (ja.call(la, a)) return !1;
    if (ka.test(a)) return ma[a] = !0;
    la[a] = !0;
    return !1;
}
function pa(a, b, c, d) {
    if (null !== c && 0 === c.type) return !1;
    switch(typeof b){
        case "function":
        case "symbol":
            return !0;
        case "boolean":
            if (d) return !1;
            if (null !== c) return !c.acceptsBooleans;
            a = a.toLowerCase().slice(0, 5);
            return "data-" !== a && "aria-" !== a;
        default:
            return !1;
    }
}
function qa(a, b, c, d) {
    if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return !0;
    if (d) return !1;
    if (null !== c) switch(c.type){
        case 3:
            return !b;
        case 4:
            return !1 === b;
        case 5:
            return isNaN(b);
        case 6:
            return isNaN(b) || 1 > b;
    }
    return !1;
}
function v(a, b, c, d, e, f, g) {
    this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
    this.attributeName = d;
    this.attributeNamespace = e;
    this.mustUseProperty = c;
    this.propertyName = a;
    this.type = b;
    this.sanitizeURL = f;
    this.removeEmptyString = g;
}
var z = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
    z[a] = new v(a, 0, !1, a, null, !1, !1);
});
[
    [
        "acceptCharset",
        "accept-charset"
    ],
    [
        "className",
        "class"
    ],
    [
        "htmlFor",
        "for"
    ],
    [
        "httpEquiv",
        "http-equiv"
    ]
].forEach(function(a) {
    var b = a[0];
    z[b] = new v(b, 1, !1, a[1], null, !1, !1);
});
[
    "contentEditable",
    "draggable",
    "spellCheck",
    "value"
].forEach(function(a) {
    z[a] = new v(a, 2, !1, a.toLowerCase(), null, !1, !1);
});
[
    "autoReverse",
    "externalResourcesRequired",
    "focusable",
    "preserveAlpha"
].forEach(function(a) {
    z[a] = new v(a, 2, !1, a, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
    z[a] = new v(a, 3, !1, a.toLowerCase(), null, !1, !1);
});
[
    "checked",
    "multiple",
    "muted",
    "selected"
].forEach(function(a) {
    z[a] = new v(a, 3, !0, a, null, !1, !1);
});
[
    "capture",
    "download"
].forEach(function(a) {
    z[a] = new v(a, 4, !1, a, null, !1, !1);
});
[
    "cols",
    "rows",
    "size",
    "span"
].forEach(function(a) {
    z[a] = new v(a, 6, !1, a, null, !1, !1);
});
[
    "rowSpan",
    "start"
].forEach(function(a) {
    z[a] = new v(a, 5, !1, a.toLowerCase(), null, !1, !1);
});
var ra = /[\-:]([a-z])/g;
function sa(a) {
    return a[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
    var b = a.replace(ra, sa);
    z[b] = new v(b, 1, !1, a, null, !1, !1);
});
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
    var b = a.replace(ra, sa);
    z[b] = new v(b, 1, !1, a, "http://www.w3.org/1999/xlink", !1, !1);
});
[
    "xml:base",
    "xml:lang",
    "xml:space"
].forEach(function(a) {
    var b = a.replace(ra, sa);
    z[b] = new v(b, 1, !1, a, "http://www.w3.org/XML/1998/namespace", !1, !1);
});
[
    "tabIndex",
    "crossOrigin"
].forEach(function(a) {
    z[a] = new v(a, 1, !1, a.toLowerCase(), null, !1, !1);
});
z.xlinkHref = new v("xlinkHref", 1, !1, "xlink:href", "http://www.w3.org/1999/xlink", !0, !1);
[
    "src",
    "href",
    "action",
    "formAction"
].forEach(function(a) {
    z[a] = new v(a, 1, !1, a.toLowerCase(), null, !0, !0);
});
function ta(a, b, c, d) {
    var e = z.hasOwnProperty(b) ? z[b] : null;
    if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? !1 : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && !0 === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
}
var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
Symbol.for("react.scope");
Symbol.for("react.debug_trace_mode");
var Ia = Symbol.for("react.offscreen");
Symbol.for("react.legacy_hidden");
Symbol.for("react.cache");
Symbol.for("react.tracing_marker");
var Ja = Symbol.iterator;
function Ka(a) {
    if (null === a || "object" !== typeof a) return null;
    a = Ja && a[Ja] || a["@@iterator"];
    return "function" === typeof a ? a : null;
}
var A = Object.assign, La;
function Ma(a) {
    if (void 0 === La) try {
        throw Error();
    } catch (c) {
        var b = c.stack.trim().match(/\n( *(at )?)/);
        La = b && b[1] || "";
    }
    return "\n" + La + a;
}
var Na = !1;
function Oa(a, b) {
    if (!a || Na) return "";
    Na = !0;
    var c = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
        if (b) {
            if (b = function() {
                throw Error();
            }, Object.defineProperty(b.prototype, "props", {
                set: function() {
                    throw Error();
                }
            }), "object" === typeof Reflect && Reflect.construct) {
                try {
                    Reflect.construct(b, []);
                } catch (l) {
                    var d = l;
                }
                Reflect.construct(a, [], b);
            } else {
                try {
                    b.call();
                } catch (l) {
                    d = l;
                }
                a.call(b.prototype);
            }
        } else {
            try {
                throw Error();
            } catch (l) {
                d = l;
            }
            a();
        }
    } catch (l) {
        if (l && d && "string" === typeof l.stack) {
            for(var e = l.stack.split("\n"), f = d.stack.split("\n"), g = e.length - 1, h = f.length - 1; 1 <= g && 0 <= h && e[g] !== f[h];)h--;
            for(; 1 <= g && 0 <= h; g--, h--)if (e[g] !== f[h]) {
                if (1 !== g || 1 !== h) {
                    do if (g--, h--, 0 > h || e[g] !== f[h]) {
                        var k = "\n" + e[g].replace(" at new ", " at ");
                        a.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a.displayName));
                        return k;
                    }
                    while (1 <= g && 0 <= h)
                }
                break;
            }
        }
    } finally{
        Na = !1, Error.prepareStackTrace = c;
    }
    return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
}
function Pa(a) {
    switch(a.tag){
        case 5:
            return Ma(a.type);
        case 16:
            return Ma("Lazy");
        case 13:
            return Ma("Suspense");
        case 19:
            return Ma("SuspenseList");
        case 0:
        case 2:
        case 15:
            return a = Oa(a.type, !1), a;
        case 11:
            return a = Oa(a.type.render, !1), a;
        case 1:
            return a = Oa(a.type, !0), a;
        default:
            return "";
    }
}
function Qa(a) {
    if (null == a) return null;
    if ("function" === typeof a) return a.displayName || a.name || null;
    if ("string" === typeof a) return a;
    switch(a){
        case ya:
            return "Fragment";
        case wa:
            return "Portal";
        case Aa:
            return "Profiler";
        case za:
            return "StrictMode";
        case Ea:
            return "Suspense";
        case Fa:
            return "SuspenseList";
    }
    if ("object" === typeof a) switch(a.$$typeof){
        case Ca:
            return (a.displayName || "Context") + ".Consumer";
        case Ba:
            return (a._context.displayName || "Context") + ".Provider";
        case Da:
            var b = a.render;
            a = a.displayName;
            a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
            return a;
        case Ga:
            return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
        case Ha:
            b = a._payload;
            a = a._init;
            try {
                return Qa(a(b));
            } catch (c) {}
    }
    return null;
}
function Ra(a) {
    var b = a.type;
    switch(a.tag){
        case 24:
            return "Cache";
        case 9:
            return (b.displayName || "Context") + ".Consumer";
        case 10:
            return (b._context.displayName || "Context") + ".Provider";
        case 18:
            return "DehydratedFragment";
        case 11:
            return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
        case 7:
            return "Fragment";
        case 5:
            return b;
        case 4:
            return "Portal";
        case 3:
            return "Root";
        case 6:
            return "Text";
        case 16:
            return Qa(b);
        case 8:
            return b === za ? "StrictMode" : "Mode";
        case 22:
            return "Offscreen";
        case 12:
            return "Profiler";
        case 21:
            return "Scope";
        case 13:
            return "Suspense";
        case 19:
            return "SuspenseList";
        case 25:
            return "TracingMarker";
        case 1:
        case 0:
        case 17:
        case 2:
        case 14:
        case 15:
            if ("function" === typeof b) return b.displayName || b.name || null;
            if ("string" === typeof b) return b;
    }
    return null;
}
function Sa(a) {
    switch(typeof a){
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return a;
        case "object":
            return a;
        default:
            return "";
    }
}
function Ta(a) {
    var b = a.type;
    return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
}
function Ua(a) {
    var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
    if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
        var e = c.get, f = c.set;
        Object.defineProperty(a, b, {
            configurable: !0,
            get: function() {
                return e.call(this);
            },
            set: function(a) {
                d = "" + a;
                f.call(this, a);
            }
        });
        Object.defineProperty(a, b, {
            enumerable: c.enumerable
        });
        return {
            getValue: function() {
                return d;
            },
            setValue: function(a) {
                d = "" + a;
            },
            stopTracking: function() {
                a._valueTracker = null;
                delete a[b];
            }
        };
    }
}
function Va(a) {
    a._valueTracker || (a._valueTracker = Ua(a));
}
function Wa(a) {
    if (!a) return !1;
    var b = a._valueTracker;
    if (!b) return !0;
    var c = b.getValue();
    var d = "";
    a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
    a = d;
    return a !== c ? (b.setValue(a), !0) : !1;
}
function Xa(a) {
    a = a || ("undefined" !== typeof document ? document : void 0);
    if ("undefined" === typeof a) return null;
    try {
        return a.activeElement || a.body;
    } catch (b) {
        return a.body;
    }
}
function Ya(a, b) {
    var c = b.checked;
    return A({}, b, {
        defaultChecked: void 0,
        defaultValue: void 0,
        value: void 0,
        checked: null != c ? c : a._wrapperState.initialChecked
    });
}
function Za(a, b) {
    var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
    c = Sa(null != b.value ? b.value : c);
    a._wrapperState = {
        initialChecked: d,
        initialValue: c,
        controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value
    };
}
function ab(a, b) {
    b = b.checked;
    null != b && ta(a, "checked", b, !1);
}
function bb(a, b) {
    ab(a, b);
    var c = Sa(b.value), d = b.type;
    if (null != c) {
        if ("number" === d) {
            if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
        } else a.value !== "" + c && (a.value = "" + c);
    } else if ("submit" === d || "reset" === d) {
        a.removeAttribute("value");
        return;
    }
    b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
    null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
}
function db(a, b, c) {
    if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
        var d = b.type;
        if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
        b = "" + a._wrapperState.initialValue;
        c || b === a.value || (a.value = b);
        a.defaultValue = b;
    }
    c = a.name;
    "" !== c && (a.name = "");
    a.defaultChecked = !!a._wrapperState.initialChecked;
    "" !== c && (a.name = c);
}
function cb(a, b, c) {
    if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
}
var eb = Array.isArray;
function fb(a, b, c, d) {
    a = a.options;
    if (b) {
        b = {};
        for(var e = 0; e < c.length; e++)b["$" + c[e]] = !0;
        for(c = 0; c < a.length; c++)e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = !0);
    } else {
        c = "" + Sa(c);
        b = null;
        for(e = 0; e < a.length; e++){
            if (a[e].value === c) {
                a[e].selected = !0;
                d && (a[e].defaultSelected = !0);
                return;
            }
            null !== b || a[e].disabled || (b = a[e]);
        }
        null !== b && (b.selected = !0);
    }
}
function gb(a, b) {
    if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
    return A({}, b, {
        value: void 0,
        defaultValue: void 0,
        children: "" + a._wrapperState.initialValue
    });
}
function hb(a, b) {
    var c = b.value;
    if (null == c) {
        c = b.children;
        b = b.defaultValue;
        if (null != c) {
            if (null != b) throw Error(p(92));
            if (eb(c)) {
                if (1 < c.length) throw Error(p(93));
                c = c[0];
            }
            b = c;
        }
        null == b && (b = "");
        c = b;
    }
    a._wrapperState = {
        initialValue: Sa(c)
    };
}
function ib(a, b) {
    var c = Sa(b.value), d = Sa(b.defaultValue);
    null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
    null != d && (a.defaultValue = "" + d);
}
function jb(a) {
    var b = a.textContent;
    b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
}
function kb(a) {
    switch(a){
        case "svg":
            return "http://www.w3.org/2000/svg";
        case "math":
            return "http://www.w3.org/1998/Math/MathML";
        default:
            return "http://www.w3.org/1999/xhtml";
    }
}
function lb(a, b) {
    return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
}
var mb, nb = function(a) {
    return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
        MSApp.execUnsafeLocalFunction(function() {
            return a(b, c, d, e);
        });
    } : a;
}(function(a, b) {
    if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
    else {
        mb = mb || document.createElement("div");
        mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
        for(b = mb.firstChild; a.firstChild;)a.removeChild(a.firstChild);
        for(; b.firstChild;)a.appendChild(b.firstChild);
    }
});
function ob(a, b) {
    if (b) {
        var c = a.firstChild;
        if (c && c === a.lastChild && 3 === c.nodeType) {
            c.nodeValue = b;
            return;
        }
    }
    a.textContent = b;
}
var pb = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0
}, qb = [
    "Webkit",
    "ms",
    "Moz",
    "O"
];
Object.keys(pb).forEach(function(a) {
    qb.forEach(function(b) {
        b = b + a.charAt(0).toUpperCase() + a.substring(1);
        pb[b] = pb[a];
    });
});
function rb(a, b, c) {
    return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
}
function sb(a, b) {
    a = a.style;
    for(var c in b)if (b.hasOwnProperty(c)) {
        var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
        "float" === c && (c = "cssFloat");
        d ? a.setProperty(c, e) : a[c] = e;
    }
}
var tb = A({
    menuitem: !0
}, {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0
});
function ub(a, b) {
    if (b) {
        if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
        if (null != b.dangerouslySetInnerHTML) {
            if (null != b.children) throw Error(p(60));
            if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
        }
        if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
    }
}
function vb(a, b) {
    if (-1 === a.indexOf("-")) return "string" === typeof b.is;
    switch(a){
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return !1;
        default:
            return !0;
    }
}
var wb = null;
function xb(a) {
    a = a.target || a.srcElement || window;
    a.correspondingUseElement && (a = a.correspondingUseElement);
    return 3 === a.nodeType ? a.parentNode : a;
}
var yb = null, zb = null, Ab = null;
function Bb(a) {
    if (a = Cb(a)) {
        if ("function" !== typeof yb) throw Error(p(280));
        var b = a.stateNode;
        b && (b = Db(b), yb(a.stateNode, a.type, b));
    }
}
function Eb(a) {
    zb ? Ab ? Ab.push(a) : Ab = [
        a
    ] : zb = a;
}
function Fb() {
    if (zb) {
        var a = zb, b = Ab;
        Ab = zb = null;
        Bb(a);
        if (b) for(a = 0; a < b.length; a++)Bb(b[a]);
    }
}
function Gb(a, b) {
    return a(b);
}
function Hb() {}
var Ib = !1;
function Jb(a, b, c) {
    if (Ib) return a(b, c);
    Ib = !0;
    try {
        return Gb(a, b, c);
    } finally{
        if (Ib = !1, null !== zb || null !== Ab) Hb(), Fb();
    }
}
function Kb(a, b) {
    var c = a.stateNode;
    if (null === c) return null;
    var d = Db(c);
    if (null === d) return null;
    c = d[b];
    a: switch(b){
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
            (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
            a = !d;
            break a;
        default:
            a = !1;
    }
    if (a) return null;
    if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
    return c;
}
var Lb = !1;
if (ia) try {
    var Mb = {};
    Object.defineProperty(Mb, "passive", {
        get: function() {
            Lb = !0;
        }
    });
    window.addEventListener("test", Mb, Mb);
    window.removeEventListener("test", Mb, Mb);
} catch (a) {
    Lb = !1;
}
function Nb(a, b, c, d, e, f, g, h, k) {
    var l = Array.prototype.slice.call(arguments, 3);
    try {
        b.apply(c, l);
    } catch (m) {
        this.onError(m);
    }
}
var Ob = !1, Pb = null, Qb = !1, Rb = null, Sb = {
    onError: function(a) {
        Ob = !0;
        Pb = a;
    }
};
function Tb(a, b, c, d, e, f, g, h, k) {
    Ob = !1;
    Pb = null;
    Nb.apply(Sb, arguments);
}
function Ub(a, b, c, d, e, f, g, h, k) {
    Tb.apply(this, arguments);
    if (Ob) {
        if (Ob) {
            var l = Pb;
            Ob = !1;
            Pb = null;
        } else throw Error(p(198));
        Qb || (Qb = !0, Rb = l);
    }
}
function Vb(a) {
    var b = a, c = a;
    if (a.alternate) for(; b.return;)b = b.return;
    else {
        a = b;
        do b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
        while (a)
    }
    return 3 === b.tag ? c : null;
}
function Wb(a) {
    if (13 === a.tag) {
        var b = a.memoizedState;
        null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
        if (null !== b) return b.dehydrated;
    }
    return null;
}
function Xb(a) {
    if (Vb(a) !== a) throw Error(p(188));
}
function Yb(a) {
    var b = a.alternate;
    if (!b) {
        b = Vb(a);
        if (null === b) throw Error(p(188));
        return b !== a ? null : a;
    }
    for(var c = a, d = b;;){
        var e = c.return;
        if (null === e) break;
        var f = e.alternate;
        if (null === f) {
            d = e.return;
            if (null !== d) {
                c = d;
                continue;
            }
            break;
        }
        if (e.child === f.child) {
            for(f = e.child; f;){
                if (f === c) return Xb(e), a;
                if (f === d) return Xb(e), b;
                f = f.sibling;
            }
            throw Error(p(188));
        }
        if (c.return !== d.return) c = e, d = f;
        else {
            for(var g = !1, h = e.child; h;){
                if (h === c) {
                    g = !0;
                    c = e;
                    d = f;
                    break;
                }
                if (h === d) {
                    g = !0;
                    d = e;
                    c = f;
                    break;
                }
                h = h.sibling;
            }
            if (!g) {
                for(h = f.child; h;){
                    if (h === c) {
                        g = !0;
                        c = f;
                        d = e;
                        break;
                    }
                    if (h === d) {
                        g = !0;
                        d = f;
                        c = e;
                        break;
                    }
                    h = h.sibling;
                }
                if (!g) throw Error(p(189));
            }
        }
        if (c.alternate !== d) throw Error(p(190));
    }
    if (3 !== c.tag) throw Error(p(188));
    return c.stateNode.current === c ? a : b;
}
function Zb(a) {
    a = Yb(a);
    return null !== a ? $b(a) : null;
}
function $b(a) {
    if (5 === a.tag || 6 === a.tag) return a;
    for(a = a.child; null !== a;){
        var b = $b(a);
        if (null !== b) return b;
        a = a.sibling;
    }
    return null;
}
var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
function mc(a) {
    if (lc && "function" === typeof lc.onCommitFiberRoot) try {
        lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
    } catch (b) {}
}
var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
function nc(a) {
    a >>>= 0;
    return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
}
var rc = 64, sc = 4194304;
function tc(a) {
    switch(a & -a){
        case 1:
            return 1;
        case 2:
            return 2;
        case 4:
            return 4;
        case 8:
            return 8;
        case 16:
            return 16;
        case 32:
            return 32;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return a & 4194240;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
            return a & 130023424;
        case 134217728:
            return 134217728;
        case 268435456:
            return 268435456;
        case 536870912:
            return 536870912;
        case 1073741824:
            return 1073741824;
        default:
            return a;
    }
}
function uc(a, b) {
    var c = a.pendingLanes;
    if (0 === c) return 0;
    var d = 0, e = a.suspendedLanes, f = a.pingedLanes, g = c & 268435455;
    if (0 !== g) {
        var h = g & ~e;
        0 !== h ? d = tc(h) : (f &= g, 0 !== f && (d = tc(f)));
    } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f && (d = tc(f));
    if (0 === d) return 0;
    if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f = b & -b, e >= f || 16 === e && 0 !== (f & 4194240))) return b;
    0 !== (d & 4) && (d |= c & 16);
    b = a.entangledLanes;
    if (0 !== b) for(a = a.entanglements, b &= d; 0 < b;)c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
    return d;
}
function vc(a, b) {
    switch(a){
        case 1:
        case 2:
        case 4:
            return b + 250;
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return b + 5E3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
            return -1;
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
            return -1;
        default:
            return -1;
    }
}
function wc(a, b) {
    for(var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f = a.pendingLanes; 0 < f;){
        var g = 31 - oc(f), h = 1 << g, k = e[g];
        if (-1 === k) {
            if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
        } else k <= b && (a.expiredLanes |= h);
        f &= ~h;
    }
}
function xc(a) {
    a = a.pendingLanes & -1073741825;
    return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
}
function yc() {
    var a = rc;
    rc <<= 1;
    0 === (rc & 4194240) && (rc = 64);
    return a;
}
function zc(a) {
    for(var b = [], c = 0; 31 > c; c++)b.push(a);
    return b;
}
function Ac(a, b, c) {
    a.pendingLanes |= b;
    536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
    a = a.eventTimes;
    b = 31 - oc(b);
    a[b] = c;
}
function Bc(a, b) {
    var c = a.pendingLanes & ~b;
    a.pendingLanes = b;
    a.suspendedLanes = 0;
    a.pingedLanes = 0;
    a.expiredLanes &= b;
    a.mutableReadLanes &= b;
    a.entangledLanes &= b;
    b = a.entanglements;
    var d = a.eventTimes;
    for(a = a.expirationTimes; 0 < c;){
        var e = 31 - oc(c), f = 1 << e;
        b[e] = 0;
        d[e] = -1;
        a[e] = -1;
        c &= ~f;
    }
}
function Cc(a, b) {
    var c = a.entangledLanes |= b;
    for(a = a.entanglements; c;){
        var d = 31 - oc(c), e = 1 << d;
        e & b | a[d] & b && (a[d] |= b);
        c &= ~e;
    }
}
var C = 0;
function Dc(a) {
    a &= -a;
    return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
}
var Ec, Fc, Gc, Hc, Ic, Jc = !1, Kc = [], Lc = null, Mc = null, Nc = null, Oc = new Map, Pc = new Map, Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a, b) {
    switch(a){
        case "focusin":
        case "focusout":
            Lc = null;
            break;
        case "dragenter":
        case "dragleave":
            Mc = null;
            break;
        case "mouseover":
        case "mouseout":
            Nc = null;
            break;
        case "pointerover":
        case "pointerout":
            Oc.delete(b.pointerId);
            break;
        case "gotpointercapture":
        case "lostpointercapture":
            Pc.delete(b.pointerId);
    }
}
function Tc(a, b, c, d, e, f) {
    if (null === a || a.nativeEvent !== f) return a = {
        blockedOn: b,
        domEventName: c,
        eventSystemFlags: d,
        nativeEvent: f,
        targetContainers: [
            e
        ]
    }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
    a.eventSystemFlags |= d;
    b = a.targetContainers;
    null !== e && -1 === b.indexOf(e) && b.push(e);
    return a;
}
function Uc(a, b, c, d, e) {
    switch(b){
        case "focusin":
            return Lc = Tc(Lc, a, b, c, d, e), !0;
        case "dragenter":
            return Mc = Tc(Mc, a, b, c, d, e), !0;
        case "mouseover":
            return Nc = Tc(Nc, a, b, c, d, e), !0;
        case "pointerover":
            var f = e.pointerId;
            Oc.set(f, Tc(Oc.get(f) || null, a, b, c, d, e));
            return !0;
        case "gotpointercapture":
            return f = e.pointerId, Pc.set(f, Tc(Pc.get(f) || null, a, b, c, d, e)), !0;
    }
    return !1;
}
function Vc(a) {
    var b = Wc(a.target);
    if (null !== b) {
        var c = Vb(b);
        if (null !== c) {
            if (b = c.tag, 13 === b) {
                if (b = Wb(c), null !== b) {
                    a.blockedOn = b;
                    Ic(a.priority, function() {
                        Gc(c);
                    });
                    return;
                }
            } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
                a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
                return;
            }
        }
    }
    a.blockedOn = null;
}
function Xc(a) {
    if (null !== a.blockedOn) return !1;
    for(var b = a.targetContainers; 0 < b.length;){
        var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
        if (null === c) {
            c = a.nativeEvent;
            var d = new c.constructor(c.type, c);
            wb = d;
            c.target.dispatchEvent(d);
            wb = null;
        } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, !1;
        b.shift();
    }
    return !0;
}
function Zc(a, b, c) {
    Xc(a) && c.delete(b);
}
function $c() {
    Jc = !1;
    null !== Lc && Xc(Lc) && (Lc = null);
    null !== Mc && Xc(Mc) && (Mc = null);
    null !== Nc && Xc(Nc) && (Nc = null);
    Oc.forEach(Zc);
    Pc.forEach(Zc);
}
function ad(a, b) {
    a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = !0, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
}
function bd(a) {
    function b(b) {
        return ad(b, a);
    }
    if (0 < Kc.length) {
        ad(Kc[0], a);
        for(var c = 1; c < Kc.length; c++){
            var d = Kc[c];
            d.blockedOn === a && (d.blockedOn = null);
        }
    }
    null !== Lc && ad(Lc, a);
    null !== Mc && ad(Mc, a);
    null !== Nc && ad(Nc, a);
    Oc.forEach(b);
    Pc.forEach(b);
    for(c = 0; c < Qc.length; c++)d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
    for(; 0 < Qc.length && (c = Qc[0], null === c.blockedOn);)Vc(c), null === c.blockedOn && Qc.shift();
}
var cd = ua.ReactCurrentBatchConfig, dd = !0;
function ed(a, b, c, d) {
    var e = C, f = cd.transition;
    cd.transition = null;
    try {
        C = 1, fd(a, b, c, d);
    } finally{
        C = e, cd.transition = f;
    }
}
function gd(a, b, c, d) {
    var e = C, f = cd.transition;
    cd.transition = null;
    try {
        C = 4, fd(a, b, c, d);
    } finally{
        C = e, cd.transition = f;
    }
}
function fd(a, b, c, d) {
    if (dd) {
        var e = Yc(a, b, c, d);
        if (null === e) hd(a, b, d, id, c), Sc(a, d);
        else if (Uc(e, a, b, c, d)) d.stopPropagation();
        else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
            for(; null !== e;){
                var f = Cb(e);
                null !== f && Ec(f);
                f = Yc(a, b, c, d);
                null === f && hd(a, b, d, id, c);
                if (f === e) break;
                e = f;
            }
            null !== e && d.stopPropagation();
        } else hd(a, b, d, null, c);
    }
}
var id = null;
function Yc(a, b, c, d) {
    id = null;
    a = xb(d);
    a = Wc(a);
    if (null !== a) {
        if (b = Vb(a), null === b) a = null;
        else if (c = b.tag, 13 === c) {
            a = Wb(b);
            if (null !== a) return a;
            a = null;
        } else if (3 === c) {
            if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
            a = null;
        } else b !== a && (a = null);
    }
    id = a;
    return null;
}
function jd(a) {
    switch(a){
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
            return 1;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "toggle":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
            return 4;
        case "message":
            switch(ec()){
                case fc:
                    return 1;
                case gc:
                    return 4;
                case hc:
                case ic:
                    return 16;
                case jc:
                    return 536870912;
                default:
                    return 16;
            }
        default:
            return 16;
    }
}
var kd = null, ld = null, md = null;
function nd() {
    if (md) return md;
    var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f = e.length;
    for(a = 0; a < c && b[a] === e[a]; a++);
    var g = c - a;
    for(d = 1; d <= g && b[c - d] === e[f - d]; d++);
    return md = e.slice(a, 1 < d ? 1 - d : void 0);
}
function od(a) {
    var b = a.keyCode;
    "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
    10 === a && (a = 13);
    return 32 <= a || 13 === a ? a : 0;
}
function pd() {
    return !0;
}
function qd() {
    return !1;
}
function rd(a) {
    function b(b, d, e, f, g) {
        this._reactName = b;
        this._targetInst = e;
        this.type = d;
        this.nativeEvent = f;
        this.target = g;
        this.currentTarget = null;
        for(var c in a)a.hasOwnProperty(c) && (b = a[c], this[c] = b ? b(f) : f[c]);
        this.isDefaultPrevented = (null != f.defaultPrevented ? f.defaultPrevented : !1 === f.returnValue) ? pd : qd;
        this.isPropagationStopped = qd;
        return this;
    }
    A(b.prototype, {
        preventDefault: function() {
            this.defaultPrevented = !0;
            var a = this.nativeEvent;
            a && (a.preventDefault ? a.preventDefault() : "unknown" !== typeof a.returnValue && (a.returnValue = !1), this.isDefaultPrevented = pd);
        },
        stopPropagation: function() {
            var a = this.nativeEvent;
            a && (a.stopPropagation ? a.stopPropagation() : "unknown" !== typeof a.cancelBubble && (a.cancelBubble = !0), this.isPropagationStopped = pd);
        },
        persist: function() {},
        isPersistent: pd
    });
    return b;
}
var sd = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(a) {
        return a.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
}, td = rd(sd), ud = A({}, sd, {
    view: 0,
    detail: 0
}), vd = rd(ud), wd, xd, yd, Ad = A({}, ud, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: zd,
    button: 0,
    buttons: 0,
    relatedTarget: function(a) {
        return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
    },
    movementX: function(a) {
        if ("movementX" in a) return a.movementX;
        a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
        return wd;
    },
    movementY: function(a) {
        return "movementY" in a ? a.movementY : xd;
    }
}), Bd = rd(Ad), Cd = A({}, Ad, {
    dataTransfer: 0
}), Dd = rd(Cd), Ed = A({}, ud, {
    relatedTarget: 0
}), Fd = rd(Ed), Gd = A({}, sd, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
}), Hd = rd(Gd), Id = A({}, sd, {
    clipboardData: function(a) {
        return "clipboardData" in a ? a.clipboardData : window.clipboardData;
    }
}), Jd = rd(Id), Kd = A({}, sd, {
    data: 0
}), Ld = rd(Kd), Md = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
}, Nd = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
}, Od = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
};
function Pd(a) {
    var b = this.nativeEvent;
    return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : !1;
}
function zd() {
    return Pd;
}
var Qd = A({}, ud, {
    key: function(a) {
        if (a.key) {
            var b = Md[a.key] || a.key;
            if ("Unidentified" !== b) return b;
        }
        return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: zd,
    charCode: function(a) {
        return "keypress" === a.type ? od(a) : 0;
    },
    keyCode: function(a) {
        return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
    },
    which: function(a) {
        return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
    }
}), Rd = rd(Qd), Sd = A({}, Ad, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
}), Td = rd(Sd), Ud = A({}, ud, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: zd
}), Vd = rd(Ud), Wd = A({}, sd, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
}), Xd = rd(Wd), Yd = A({}, Ad, {
    deltaX: function(a) {
        return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
    },
    deltaY: function(a) {
        return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
}), Zd = rd(Yd), $d = [
    9,
    13,
    27,
    32
], ae = ia && "CompositionEvent" in window, be = null;
ia && "documentMode" in document && (be = document.documentMode);
var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = !1;
function ge(a, b) {
    switch(a){
        case "keyup":
            return -1 !== $d.indexOf(b.keyCode);
        case "keydown":
            return 229 !== b.keyCode;
        case "keypress":
        case "mousedown":
        case "focusout":
            return !0;
        default:
            return !1;
    }
}
function he(a) {
    a = a.detail;
    return "object" === typeof a && "data" in a ? a.data : null;
}
var ie = !1;
function je(a, b) {
    switch(a){
        case "compositionend":
            return he(b);
        case "keypress":
            if (32 !== b.which) return null;
            fe = !0;
            return ee;
        case "textInput":
            return a = b.data, a === ee && fe ? null : a;
        default:
            return null;
    }
}
function ke(a, b) {
    if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = !1, a) : null;
    switch(a){
        case "paste":
            return null;
        case "keypress":
            if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
                if (b.char && 1 < b.char.length) return b.char;
                if (b.which) return String.fromCharCode(b.which);
            }
            return null;
        case "compositionend":
            return de && "ko" !== b.locale ? null : b.data;
        default:
            return null;
    }
}
var le = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
};
function me(a) {
    var b = a && a.nodeName && a.nodeName.toLowerCase();
    return "input" === b ? !!le[a.type] : "textarea" === b ? !0 : !1;
}
function ne(a, b, c, d) {
    Eb(d);
    b = oe(b, "onChange");
    0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({
        event: c,
        listeners: b
    }));
}
var pe = null, qe = null;
function re(a) {
    se(a, 0);
}
function te(a) {
    var b = ue(a);
    if (Wa(b)) return a;
}
function ve(a, b) {
    if ("change" === a) return b;
}
var we = !1;
if (ia) {
    var xe;
    if (ia) {
        var ye = "oninput" in document;
        if (!ye) {
            var ze = document.createElement("div");
            ze.setAttribute("oninput", "return;");
            ye = "function" === typeof ze.oninput;
        }
        xe = ye;
    } else xe = !1;
    we = xe && (!document.documentMode || 9 < document.documentMode);
}
function Ae() {
    pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
}
function Be(a) {
    if ("value" === a.propertyName && te(qe)) {
        var b = [];
        ne(b, qe, a, xb(a));
        Jb(re, b);
    }
}
function Ce(a, b, c) {
    "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
}
function De(a) {
    if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
}
function Ee(a, b) {
    if ("click" === a) return te(b);
}
function Fe(a, b) {
    if ("input" === a || "change" === a) return te(b);
}
function Ge(a, b) {
    return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var He = "function" === typeof Object.is ? Object.is : Ge;
function Ie(a, b) {
    if (He(a, b)) return !0;
    if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return !1;
    var c = Object.keys(a), d = Object.keys(b);
    if (c.length !== d.length) return !1;
    for(d = 0; d < c.length; d++){
        var e = c[d];
        if (!ja.call(b, e) || !He(a[e], b[e])) return !1;
    }
    return !0;
}
function Je(a) {
    for(; a && a.firstChild;)a = a.firstChild;
    return a;
}
function Ke(a, b) {
    var c = Je(a);
    a = 0;
    for(var d; c;){
        if (3 === c.nodeType) {
            d = a + c.textContent.length;
            if (a <= b && d >= b) return {
                node: c,
                offset: b - a
            };
            a = d;
        }
        a: {
            for(; c;){
                if (c.nextSibling) {
                    c = c.nextSibling;
                    break a;
                }
                c = c.parentNode;
            }
            c = void 0;
        }
        c = Je(c);
    }
}
function Le(a, b) {
    return a && b ? a === b ? !0 : a && 3 === a.nodeType ? !1 : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : !1 : !1;
}
function Me() {
    for(var a = window, b = Xa(); b instanceof a.HTMLIFrameElement;){
        try {
            var c = "string" === typeof b.contentWindow.location.href;
        } catch (d) {
            c = !1;
        }
        if (c) a = b.contentWindow;
        else break;
        b = Xa(a.document);
    }
    return b;
}
function Ne(a) {
    var b = a && a.nodeName && a.nodeName.toLowerCase();
    return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
}
function Oe(a) {
    var b = Me(), c = a.focusedElem, d = a.selectionRange;
    if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
        if (null !== d && Ne(c)) {
            if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
            else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
                a = a.getSelection();
                var e = c.textContent.length, f = Math.min(d.start, e);
                d = void 0 === d.end ? f : Math.min(d.end, e);
                !a.extend && f > d && (e = d, d = f, f = e);
                e = Ke(c, f);
                var g = Ke(c, d);
                e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
            }
        }
        b = [];
        for(a = c; a = a.parentNode;)1 === a.nodeType && b.push({
            element: a,
            left: a.scrollLeft,
            top: a.scrollTop
        });
        "function" === typeof c.focus && c.focus();
        for(c = 0; c < b.length; c++)a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
    }
}
var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = !1;
function Ue(a, b, c) {
    var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
    Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = {
        start: d.selectionStart,
        end: d.selectionEnd
    } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = {
        anchorNode: d.anchorNode,
        anchorOffset: d.anchorOffset,
        focusNode: d.focusNode,
        focusOffset: d.focusOffset
    }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({
        event: b,
        listeners: d
    }), b.target = Qe)));
}
function Ve(a, b) {
    var c = {};
    c[a.toLowerCase()] = b.toLowerCase();
    c["Webkit" + a] = "webkit" + b;
    c["Moz" + a] = "moz" + b;
    return c;
}
var We = {
    animationend: Ve("Animation", "AnimationEnd"),
    animationiteration: Ve("Animation", "AnimationIteration"),
    animationstart: Ve("Animation", "AnimationStart"),
    transitionend: Ve("Transition", "TransitionEnd")
}, Xe = {}, Ye = {};
ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
function Ze(a) {
    if (Xe[a]) return Xe[a];
    if (!We[a]) return a;
    var b = We[a], c;
    for(c in b)if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
    return a;
}
var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = new Map, ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a, b) {
    df.set(a, b);
    fa(b, [
        a
    ]);
}
for(var gf = 0; gf < ef.length; gf++){
    var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
    ff(jf, "on" + kf);
}
ff($e, "onAnimationEnd");
ff(af, "onAnimationIteration");
ff(bf, "onAnimationStart");
ff("dblclick", "onDoubleClick");
ff("focusin", "onFocus");
ff("focusout", "onBlur");
ff(cf, "onTransitionEnd");
ha("onMouseEnter", [
    "mouseout",
    "mouseover"
]);
ha("onMouseLeave", [
    "mouseout",
    "mouseover"
]);
ha("onPointerEnter", [
    "pointerout",
    "pointerover"
]);
ha("onPointerLeave", [
    "pointerout",
    "pointerover"
]);
fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
fa("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
]);
fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a, b, c) {
    var d = a.type || "unknown-event";
    a.currentTarget = c;
    Ub(d, b, void 0, a);
    a.currentTarget = null;
}
function se(a, b) {
    b = 0 !== (b & 4);
    for(var c = 0; c < a.length; c++){
        var d = a[c], e = d.event;
        d = d.listeners;
        a: {
            var f = void 0;
            if (b) for(var g = d.length - 1; 0 <= g; g--){
                var h = d[g], k = h.instance, l = h.currentTarget;
                h = h.listener;
                if (k !== f && e.isPropagationStopped()) break a;
                nf(e, h, l);
                f = k;
            }
            else for(g = 0; g < d.length; g++){
                h = d[g];
                k = h.instance;
                l = h.currentTarget;
                h = h.listener;
                if (k !== f && e.isPropagationStopped()) break a;
                nf(e, h, l);
                f = k;
            }
        }
    }
    if (Qb) throw a = Rb, Qb = !1, Rb = null, a;
}
function D(a, b) {
    var c = b[of];
    void 0 === c && (c = b[of] = new Set);
    var d = a + "__bubble";
    c.has(d) || (pf(b, a, 2, !1), c.add(d));
}
function qf(a, b, c) {
    var d = 0;
    b && (d |= 4);
    pf(c, a, d, b);
}
var rf = "_reactListening" + Math.random().toString(36).slice(2);
function sf(a) {
    if (!a[rf]) {
        a[rf] = !0;
        da.forEach(function(b) {
            "selectionchange" !== b && (mf.has(b) || qf(b, !1, a), qf(b, !0, a));
        });
        var b = 9 === a.nodeType ? a : a.ownerDocument;
        null === b || b[rf] || (b[rf] = !0, qf("selectionchange", !1, b));
    }
}
function pf(a, b, c, d) {
    switch(jd(b)){
        case 1:
            var e = ed;
            break;
        case 4:
            e = gd;
            break;
        default:
            e = fd;
    }
    c = e.bind(null, b, c, a);
    e = void 0;
    !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = !0);
    d ? void 0 !== e ? a.addEventListener(b, c, {
        capture: !0,
        passive: e
    }) : a.addEventListener(b, c, !0) : void 0 !== e ? a.addEventListener(b, c, {
        passive: e
    }) : a.addEventListener(b, c, !1);
}
function hd(a, b, c, d, e) {
    var f = d;
    if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for(;;){
        if (null === d) return;
        var g = d.tag;
        if (3 === g || 4 === g) {
            var h = d.stateNode.containerInfo;
            if (h === e || 8 === h.nodeType && h.parentNode === e) break;
            if (4 === g) for(g = d.return; null !== g;){
                var k = g.tag;
                if (3 === k || 4 === k) {
                    if (k = g.stateNode.containerInfo, k === e || 8 === k.nodeType && k.parentNode === e) return;
                }
                g = g.return;
            }
            for(; null !== h;){
                g = Wc(h);
                if (null === g) return;
                k = g.tag;
                if (5 === k || 6 === k) {
                    d = f = g;
                    continue a;
                }
                h = h.parentNode;
            }
        }
        d = d.return;
    }
    Jb(function() {
        var d = f, e = xb(c), g = [];
        a: {
            var h = df.get(a);
            if (void 0 !== h) {
                var k = td, n = a;
                switch(a){
                    case "keypress":
                        if (0 === od(c)) break a;
                    case "keydown":
                    case "keyup":
                        k = Rd;
                        break;
                    case "focusin":
                        n = "focus";
                        k = Fd;
                        break;
                    case "focusout":
                        n = "blur";
                        k = Fd;
                        break;
                    case "beforeblur":
                    case "afterblur":
                        k = Fd;
                        break;
                    case "click":
                        if (2 === c.button) break a;
                    case "auxclick":
                    case "dblclick":
                    case "mousedown":
                    case "mousemove":
                    case "mouseup":
                    case "mouseout":
                    case "mouseover":
                    case "contextmenu":
                        k = Bd;
                        break;
                    case "drag":
                    case "dragend":
                    case "dragenter":
                    case "dragexit":
                    case "dragleave":
                    case "dragover":
                    case "dragstart":
                    case "drop":
                        k = Dd;
                        break;
                    case "touchcancel":
                    case "touchend":
                    case "touchmove":
                    case "touchstart":
                        k = Vd;
                        break;
                    case $e:
                    case af:
                    case bf:
                        k = Hd;
                        break;
                    case cf:
                        k = Xd;
                        break;
                    case "scroll":
                        k = vd;
                        break;
                    case "wheel":
                        k = Zd;
                        break;
                    case "copy":
                    case "cut":
                    case "paste":
                        k = Jd;
                        break;
                    case "gotpointercapture":
                    case "lostpointercapture":
                    case "pointercancel":
                    case "pointerdown":
                    case "pointermove":
                    case "pointerout":
                    case "pointerover":
                    case "pointerup":
                        k = Td;
                }
                var t = 0 !== (b & 4), J = !t && "scroll" === a, x = t ? null !== h ? h + "Capture" : null : h;
                t = [];
                for(var w = d, u; null !== w;){
                    u = w;
                    var F = u.stateNode;
                    5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t.push(tf(w, F, u))));
                    if (J) break;
                    w = w.return;
                }
                0 < t.length && (h = new k(h, n, null, c, e), g.push({
                    event: h,
                    listeners: t
                }));
            }
        }
        if (0 === (b & 7)) {
            a: {
                h = "mouseover" === a || "pointerover" === a;
                k = "mouseout" === a || "pointerout" === a;
                if (h && c !== wb && (n = c.relatedTarget || c.fromElement) && (Wc(n) || n[uf])) break a;
                if (k || h) {
                    h = e.window === e ? e : (h = e.ownerDocument) ? h.defaultView || h.parentWindow : window;
                    if (k) {
                        if (n = c.relatedTarget || c.toElement, k = d, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag)) n = null;
                    } else k = null, n = d;
                    if (k !== n) {
                        t = Bd;
                        F = "onMouseLeave";
                        x = "onMouseEnter";
                        w = "mouse";
                        if ("pointerout" === a || "pointerover" === a) t = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
                        J = null == k ? h : ue(k);
                        u = null == n ? h : ue(n);
                        h = new t(F, w + "leave", k, c, e);
                        h.target = J;
                        h.relatedTarget = u;
                        F = null;
                        Wc(e) === d && (t = new t(x, w + "enter", n, c, e), t.target = u, t.relatedTarget = J, F = t);
                        J = F;
                        if (k && n) b: {
                            t = k;
                            x = n;
                            w = 0;
                            for(u = t; u; u = vf(u))w++;
                            u = 0;
                            for(F = x; F; F = vf(F))u++;
                            for(; 0 < w - u;)t = vf(t), w--;
                            for(; 0 < u - w;)x = vf(x), u--;
                            for(; w--;){
                                if (t === x || null !== x && t === x.alternate) break b;
                                t = vf(t);
                                x = vf(x);
                            }
                            t = null;
                        }
                        else t = null;
                        null !== k && wf(g, h, k, t, !1);
                        null !== n && null !== J && wf(g, J, n, t, !0);
                    }
                }
            }
            a: {
                h = d ? ue(d) : window;
                k = h.nodeName && h.nodeName.toLowerCase();
                if ("select" === k || "input" === k && "file" === h.type) var na = ve;
                else if (me(h)) {
                    if (we) na = Fe;
                    else {
                        na = De;
                        var xa = Ce;
                    }
                } else (k = h.nodeName) && "input" === k.toLowerCase() && ("checkbox" === h.type || "radio" === h.type) && (na = Ee);
                if (na && (na = na(a, d))) {
                    ne(g, na, c, e);
                    break a;
                }
                xa && xa(a, h, d);
                "focusout" === a && (xa = h._wrapperState) && xa.controlled && "number" === h.type && cb(h, "number", h.value);
            }
            xa = d ? ue(d) : window;
            switch(a){
                case "focusin":
                    if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d, Se = null;
                    break;
                case "focusout":
                    Se = Re = Qe = null;
                    break;
                case "mousedown":
                    Te = !0;
                    break;
                case "contextmenu":
                case "mouseup":
                case "dragend":
                    Te = !1;
                    Ue(g, c, e);
                    break;
                case "selectionchange":
                    if (Pe) break;
                case "keydown":
                case "keyup":
                    Ue(g, c, e);
            }
            var $a;
            if (ae) b: {
                switch(a){
                    case "compositionstart":
                        var ba = "onCompositionStart";
                        break b;
                    case "compositionend":
                        ba = "onCompositionEnd";
                        break b;
                    case "compositionupdate":
                        ba = "onCompositionUpdate";
                        break b;
                }
                ba = void 0;
            }
            else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
            ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e, ld = "value" in kd ? kd.value : kd.textContent, ie = !0)), xa = oe(d, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e), g.push({
                event: ba,
                listeners: xa
            }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
            if ($a = ce ? je(a, c) : ke(a, c)) d = oe(d, "onBeforeInput"), 0 < d.length && (e = new Ld("onBeforeInput", "beforeinput", null, c, e), g.push({
                event: e,
                listeners: d
            }), e.data = $a);
        }
        se(g, b);
    });
}
function tf(a, b, c) {
    return {
        instance: a,
        listener: b,
        currentTarget: c
    };
}
function oe(a, b) {
    for(var c = b + "Capture", d = []; null !== a;){
        var e = a, f = e.stateNode;
        5 === e.tag && null !== f && (e = f, f = Kb(a, c), null != f && d.unshift(tf(a, f, e)), f = Kb(a, b), null != f && d.push(tf(a, f, e)));
        a = a.return;
    }
    return d;
}
function vf(a) {
    if (null === a) return null;
    do a = a.return;
    while (a && 5 !== a.tag)
    return a ? a : null;
}
function wf(a, b, c, d, e) {
    for(var f = b._reactName, g = []; null !== c && c !== d;){
        var h = c, k = h.alternate, l = h.stateNode;
        if (null !== k && k === d) break;
        5 === h.tag && null !== l && (h = l, e ? (k = Kb(c, f), null != k && g.unshift(tf(c, k, h))) : e || (k = Kb(c, f), null != k && g.push(tf(c, k, h))));
        c = c.return;
    }
    0 !== g.length && a.push({
        event: b,
        listeners: g
    });
}
var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
function zf(a) {
    return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
}
function Af(a, b, c) {
    b = zf(b);
    if (zf(a) !== b && c) throw Error(p(425));
}
function Bf() {}
var Cf = null, Df = null;
function Ef(a, b) {
    return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
}
var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
    return Hf.resolve(null).then(a).catch(If);
} : Ff;
function If(a) {
    setTimeout(function() {
        throw a;
    });
}
function Kf(a, b) {
    var c = b, d = 0;
    do {
        var e = c.nextSibling;
        a.removeChild(c);
        if (e && 8 === e.nodeType) {
            if (c = e.data, "/$" === c) {
                if (0 === d) {
                    a.removeChild(e);
                    bd(b);
                    return;
                }
                d--;
            } else "$" !== c && "$?" !== c && "$!" !== c || d++;
        }
        c = e;
    }while (c)
    bd(b);
}
function Lf(a) {
    for(; null != a; a = a.nextSibling){
        var b = a.nodeType;
        if (1 === b || 3 === b) break;
        if (8 === b) {
            b = a.data;
            if ("$" === b || "$!" === b || "$?" === b) break;
            if ("/$" === b) return null;
        }
    }
    return a;
}
function Mf(a) {
    a = a.previousSibling;
    for(var b = 0; a;){
        if (8 === a.nodeType) {
            var c = a.data;
            if ("$" === c || "$!" === c || "$?" === c) {
                if (0 === b) return a;
                b--;
            } else "/$" === c && b++;
        }
        a = a.previousSibling;
    }
    return null;
}
var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
function Wc(a) {
    var b = a[Of];
    if (b) return b;
    for(var c = a.parentNode; c;){
        if (b = c[uf] || c[Of]) {
            c = b.alternate;
            if (null !== b.child || null !== c && null !== c.child) for(a = Mf(a); null !== a;){
                if (c = a[Of]) return c;
                a = Mf(a);
            }
            return b;
        }
        a = c;
        c = a.parentNode;
    }
    return null;
}
function Cb(a) {
    a = a[Of] || a[uf];
    return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
}
function ue(a) {
    if (5 === a.tag || 6 === a.tag) return a.stateNode;
    throw Error(p(33));
}
function Db(a) {
    return a[Pf] || null;
}
var Sf = [], Tf = -1;
function Uf(a) {
    return {
        current: a
    };
}
function E(a) {
    0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
}
function G(a, b) {
    Tf++;
    Sf[Tf] = a.current;
    a.current = b;
}
var Vf = {}, H = Uf(Vf), Wf = Uf(!1), Xf = Vf;
function Yf(a, b) {
    var c = a.type.contextTypes;
    if (!c) return Vf;
    var d = a.stateNode;
    if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
    var e = {}, f;
    for(f in c)e[f] = b[f];
    d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
    return e;
}
function Zf(a) {
    a = a.childContextTypes;
    return null !== a && void 0 !== a;
}
function $f() {
    E(Wf);
    E(H);
}
function ag(a, b, c) {
    if (H.current !== Vf) throw Error(p(168));
    G(H, b);
    G(Wf, c);
}
function bg(a, b, c) {
    var d = a.stateNode;
    b = b.childContextTypes;
    if ("function" !== typeof d.getChildContext) return c;
    d = d.getChildContext();
    for(var e in d)if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
    return A({}, c, d);
}
function cg(a) {
    a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
    Xf = H.current;
    G(H, a);
    G(Wf, Wf.current);
    return !0;
}
function dg(a, b, c) {
    var d = a.stateNode;
    if (!d) throw Error(p(169));
    c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
    G(Wf, c);
}
var eg = null, fg = !1, gg = !1;
function hg(a) {
    null === eg ? eg = [
        a
    ] : eg.push(a);
}
function ig(a) {
    fg = !0;
    hg(a);
}
function jg() {
    if (!gg && null !== eg) {
        gg = !0;
        var a = 0, b = C;
        try {
            var c = eg;
            for(C = 1; a < c.length; a++){
                var d = c[a];
                do d = d(!0);
                while (null !== d)
            }
            eg = null;
            fg = !1;
        } catch (e) {
            throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
        } finally{
            C = b, gg = !1;
        }
    }
    return null;
}
var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
function tg(a, b) {
    kg[lg++] = ng;
    kg[lg++] = mg;
    mg = a;
    ng = b;
}
function ug(a, b, c) {
    og[pg++] = rg;
    og[pg++] = sg;
    og[pg++] = qg;
    qg = a;
    var d = rg;
    a = sg;
    var e = 32 - oc(d) - 1;
    d &= ~(1 << e);
    c += 1;
    var f = 32 - oc(b) + e;
    if (30 < f) {
        var g = e - e % 5;
        f = (d & (1 << g) - 1).toString(32);
        d >>= g;
        e -= g;
        rg = 1 << 32 - oc(b) + e | c << e | d;
        sg = f + a;
    } else rg = 1 << f | c << e | d, sg = a;
}
function vg(a) {
    null !== a.return && (tg(a, 1), ug(a, 1, 0));
}
function wg(a) {
    for(; a === mg;)mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
    for(; a === qg;)qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
}
var xg = null, yg = null, I = !1, zg = null;
function Ag(a, b) {
    var c = Bg(5, null, null, 0);
    c.elementType = "DELETED";
    c.stateNode = b;
    c.return = a;
    b = a.deletions;
    null === b ? (a.deletions = [
        c
    ], a.flags |= 16) : b.push(c);
}
function Cg(a, b) {
    switch(a.tag){
        case 5:
            var c = a.type;
            b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
            return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), !0) : !1;
        case 6:
            return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, !0) : !1;
        case 13:
            return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? {
                id: rg,
                overflow: sg
            } : null, a.memoizedState = {
                dehydrated: b,
                treeContext: c,
                retryLane: 1073741824
            }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, !0) : !1;
        default:
            return !1;
    }
}
function Dg(a) {
    return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
}
function Eg(a) {
    if (I) {
        var b = yg;
        if (b) {
            var c = b;
            if (!Cg(a, b)) {
                if (Dg(a)) throw Error(p(418));
                b = Lf(c.nextSibling);
                var d = xg;
                b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = !1, xg = a);
            }
        } else {
            if (Dg(a)) throw Error(p(418));
            a.flags = a.flags & -4097 | 2;
            I = !1;
            xg = a;
        }
    }
}
function Fg(a) {
    for(a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag;)a = a.return;
    xg = a;
}
function Gg(a) {
    if (a !== xg) return !1;
    if (!I) return Fg(a), I = !0, !1;
    var b;
    (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
    if (b && (b = yg)) {
        if (Dg(a)) throw Hg(), Error(p(418));
        for(; b;)Ag(a, b), b = Lf(b.nextSibling);
    }
    Fg(a);
    if (13 === a.tag) {
        a = a.memoizedState;
        a = null !== a ? a.dehydrated : null;
        if (!a) throw Error(p(317));
        a: {
            a = a.nextSibling;
            for(b = 0; a;){
                if (8 === a.nodeType) {
                    var c = a.data;
                    if ("/$" === c) {
                        if (0 === b) {
                            yg = Lf(a.nextSibling);
                            break a;
                        }
                        b--;
                    } else "$" !== c && "$!" !== c && "$?" !== c || b++;
                }
                a = a.nextSibling;
            }
            yg = null;
        }
    } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
    return !0;
}
function Hg() {
    for(var a = yg; a;)a = Lf(a.nextSibling);
}
function Ig() {
    yg = xg = null;
    I = !1;
}
function Jg(a) {
    null === zg ? zg = [
        a
    ] : zg.push(a);
}
var Kg = ua.ReactCurrentBatchConfig;
function Lg(a, b, c) {
    a = c.ref;
    if (null !== a && "function" !== typeof a && "object" !== typeof a) {
        if (c._owner) {
            c = c._owner;
            if (c) {
                if (1 !== c.tag) throw Error(p(309));
                var d = c.stateNode;
            }
            if (!d) throw Error(p(147, a));
            var e = d, f = "" + a;
            if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f) return b.ref;
            b = function(a) {
                var b = e.refs;
                null === a ? delete b[f] : b[f] = a;
            };
            b._stringRef = f;
            return b;
        }
        if ("string" !== typeof a) throw Error(p(284));
        if (!c._owner) throw Error(p(290, a));
    }
    return a;
}
function Mg(a, b) {
    a = Object.prototype.toString.call(b);
    throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
}
function Ng(a) {
    var b = a._init;
    return b(a._payload);
}
function Og(a) {
    function b(b, c) {
        if (a) {
            var d = b.deletions;
            null === d ? (b.deletions = [
                c
            ], b.flags |= 16) : d.push(c);
        }
    }
    function c(c, d) {
        if (!a) return null;
        for(; null !== d;)b(c, d), d = d.sibling;
        return null;
    }
    function d(a, b) {
        for(a = new Map; null !== b;)null !== b.key ? a.set(b.key, b) : a.set(b.index, b), b = b.sibling;
        return a;
    }
    function e(a, b) {
        a = Pg(a, b);
        a.index = 0;
        a.sibling = null;
        return a;
    }
    function f(b, c, d) {
        b.index = d;
        if (!a) return b.flags |= 1048576, c;
        d = b.alternate;
        if (null !== d) return d = d.index, d < c ? (b.flags |= 2, c) : d;
        b.flags |= 2;
        return c;
    }
    function g(b) {
        a && null === b.alternate && (b.flags |= 2);
        return b;
    }
    function h(a, b, c, d) {
        if (null === b || 6 !== b.tag) return b = Qg(c, a.mode, d), b.return = a, b;
        b = e(b, c);
        b.return = a;
        return b;
    }
    function k(a, b, c, d) {
        var f = c.type;
        if (f === ya) return m(a, b, c.props.children, d, c.key);
        if (null !== b && (b.elementType === f || "object" === typeof f && null !== f && f.$$typeof === Ha && Ng(f) === b.type)) return d = e(b, c.props), d.ref = Lg(a, b, c), d.return = a, d;
        d = Rg(c.type, c.key, c.props, null, a.mode, d);
        d.ref = Lg(a, b, c);
        d.return = a;
        return d;
    }
    function l(a, b, c, d) {
        if (null === b || 4 !== b.tag || b.stateNode.containerInfo !== c.containerInfo || b.stateNode.implementation !== c.implementation) return b = Sg(c, a.mode, d), b.return = a, b;
        b = e(b, c.children || []);
        b.return = a;
        return b;
    }
    function m(a, b, c, d, f) {
        if (null === b || 7 !== b.tag) return b = Tg(c, a.mode, d, f), b.return = a, b;
        b = e(b, c);
        b.return = a;
        return b;
    }
    function q(a, b, c) {
        if ("string" === typeof b && "" !== b || "number" === typeof b) return b = Qg("" + b, a.mode, c), b.return = a, b;
        if ("object" === typeof b && null !== b) {
            switch(b.$$typeof){
                case va:
                    return c = Rg(b.type, b.key, b.props, null, a.mode, c), c.ref = Lg(a, null, b), c.return = a, c;
                case wa:
                    return b = Sg(b, a.mode, c), b.return = a, b;
                case Ha:
                    var d = b._init;
                    return q(a, d(b._payload), c);
            }
            if (eb(b) || Ka(b)) return b = Tg(b, a.mode, c, null), b.return = a, b;
            Mg(a, b);
        }
        return null;
    }
    function r(a, b, c, d) {
        var e = null !== b ? b.key : null;
        if ("string" === typeof c && "" !== c || "number" === typeof c) return null !== e ? null : h(a, b, "" + c, d);
        if ("object" === typeof c && null !== c) {
            switch(c.$$typeof){
                case va:
                    return c.key === e ? k(a, b, c, d) : null;
                case wa:
                    return c.key === e ? l(a, b, c, d) : null;
                case Ha:
                    return e = c._init, r(a, b, e(c._payload), d);
            }
            if (eb(c) || Ka(c)) return null !== e ? null : m(a, b, c, d, null);
            Mg(a, c);
        }
        return null;
    }
    function y(a, b, c, d, e) {
        if ("string" === typeof d && "" !== d || "number" === typeof d) return a = a.get(c) || null, h(b, a, "" + d, e);
        if ("object" === typeof d && null !== d) {
            switch(d.$$typeof){
                case va:
                    return a = a.get(null === d.key ? c : d.key) || null, k(b, a, d, e);
                case wa:
                    return a = a.get(null === d.key ? c : d.key) || null, l(b, a, d, e);
                case Ha:
                    var f = d._init;
                    return y(a, b, c, f(d._payload), e);
            }
            if (eb(d) || Ka(d)) return a = a.get(c) || null, m(b, a, d, e, null);
            Mg(b, d);
        }
        return null;
    }
    function n(e, g, h, k) {
        for(var l = null, m = null, u = g, w = g = 0, x = null; null !== u && w < h.length; w++){
            u.index > w ? (x = u, u = null) : x = u.sibling;
            var n = r(e, u, h[w], k);
            if (null === n) {
                null === u && (u = x);
                break;
            }
            a && u && null === n.alternate && b(e, u);
            g = f(n, g, w);
            null === m ? l = n : m.sibling = n;
            m = n;
            u = x;
        }
        if (w === h.length) return c(e, u), I && tg(e, w), l;
        if (null === u) {
            for(; w < h.length; w++)u = q(e, h[w], k), null !== u && (g = f(u, g, w), null === m ? l = u : m.sibling = u, m = u);
            I && tg(e, w);
            return l;
        }
        for(u = d(e, u); w < h.length; w++)x = y(u, e, w, h[w], k), null !== x && (a && null !== x.alternate && u.delete(null === x.key ? w : x.key), g = f(x, g, w), null === m ? l = x : m.sibling = x, m = x);
        a && u.forEach(function(a) {
            return b(e, a);
        });
        I && tg(e, w);
        return l;
    }
    function t(e, g, h, k) {
        var l = Ka(h);
        if ("function" !== typeof l) throw Error(p(150));
        h = l.call(h);
        if (null == h) throw Error(p(151));
        for(var u = l = null, m = g, w = g = 0, x = null, n = h.next(); null !== m && !n.done; w++, n = h.next()){
            m.index > w ? (x = m, m = null) : x = m.sibling;
            var t = r(e, m, n.value, k);
            if (null === t) {
                null === m && (m = x);
                break;
            }
            a && m && null === t.alternate && b(e, m);
            g = f(t, g, w);
            null === u ? l = t : u.sibling = t;
            u = t;
            m = x;
        }
        if (n.done) return c(e, m), I && tg(e, w), l;
        if (null === m) {
            for(; !n.done; w++, n = h.next())n = q(e, n.value, k), null !== n && (g = f(n, g, w), null === u ? l = n : u.sibling = n, u = n);
            I && tg(e, w);
            return l;
        }
        for(m = d(e, m); !n.done; w++, n = h.next())n = y(m, e, w, n.value, k), null !== n && (a && null !== n.alternate && m.delete(null === n.key ? w : n.key), g = f(n, g, w), null === u ? l = n : u.sibling = n, u = n);
        a && m.forEach(function(a) {
            return b(e, a);
        });
        I && tg(e, w);
        return l;
    }
    function J(a, d, f, h) {
        "object" === typeof f && null !== f && f.type === ya && null === f.key && (f = f.props.children);
        if ("object" === typeof f && null !== f) {
            switch(f.$$typeof){
                case va:
                    a: {
                        for(var k = f.key, l = d; null !== l;){
                            if (l.key === k) {
                                k = f.type;
                                if (k === ya) {
                                    if (7 === l.tag) {
                                        c(a, l.sibling);
                                        d = e(l, f.props.children);
                                        d.return = a;
                                        a = d;
                                        break a;
                                    }
                                } else if (l.elementType === k || "object" === typeof k && null !== k && k.$$typeof === Ha && Ng(k) === l.type) {
                                    c(a, l.sibling);
                                    d = e(l, f.props);
                                    d.ref = Lg(a, l, f);
                                    d.return = a;
                                    a = d;
                                    break a;
                                }
                                c(a, l);
                                break;
                            } else b(a, l);
                            l = l.sibling;
                        }
                        f.type === ya ? (d = Tg(f.props.children, a.mode, h, f.key), d.return = a, a = d) : (h = Rg(f.type, f.key, f.props, null, a.mode, h), h.ref = Lg(a, d, f), h.return = a, a = h);
                    }
                    return g(a);
                case wa:
                    a: {
                        for(l = f.key; null !== d;){
                            if (d.key === l) {
                                if (4 === d.tag && d.stateNode.containerInfo === f.containerInfo && d.stateNode.implementation === f.implementation) {
                                    c(a, d.sibling);
                                    d = e(d, f.children || []);
                                    d.return = a;
                                    a = d;
                                    break a;
                                } else {
                                    c(a, d);
                                    break;
                                }
                            } else b(a, d);
                            d = d.sibling;
                        }
                        d = Sg(f, a.mode, h);
                        d.return = a;
                        a = d;
                    }
                    return g(a);
                case Ha:
                    return l = f._init, J(a, d, l(f._payload), h);
            }
            if (eb(f)) return n(a, d, f, h);
            if (Ka(f)) return t(a, d, f, h);
            Mg(a, f);
        }
        return "string" === typeof f && "" !== f || "number" === typeof f ? (f = "" + f, null !== d && 6 === d.tag ? (c(a, d.sibling), d = e(d, f), d.return = a, a = d) : (c(a, d), d = Qg(f, a.mode, h), d.return = a, a = d), g(a)) : c(a, d);
    }
    return J;
}
var Ug = Og(!0), Vg = Og(!1), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
function $g() {
    Zg = Yg = Xg = null;
}
function ah(a) {
    var b = Wg.current;
    E(Wg);
    a._currentValue = b;
}
function bh(a, b, c) {
    for(; null !== a;){
        var d = a.alternate;
        (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
        if (a === c) break;
        a = a.return;
    }
}
function ch(a, b) {
    Xg = a;
    Zg = Yg = null;
    a = a.dependencies;
    null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = !0), a.firstContext = null);
}
function eh(a) {
    var b = a._currentValue;
    if (Zg !== a) {
        if (a = {
            context: a,
            memoizedValue: b,
            next: null
        }, null === Yg) {
            if (null === Xg) throw Error(p(308));
            Yg = a;
            Xg.dependencies = {
                lanes: 0,
                firstContext: a
            };
        } else Yg = Yg.next = a;
    }
    return b;
}
var fh = null;
function gh(a) {
    null === fh ? fh = [
        a
    ] : fh.push(a);
}
function hh(a, b, c, d) {
    var e = b.interleaved;
    null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
    b.interleaved = c;
    return ih(a, d);
}
function ih(a, b) {
    a.lanes |= b;
    var c = a.alternate;
    null !== c && (c.lanes |= b);
    c = a;
    for(a = a.return; null !== a;)a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
    return 3 === c.tag ? c.stateNode : null;
}
var jh = !1;
function kh(a) {
    a.updateQueue = {
        baseState: a.memoizedState,
        firstBaseUpdate: null,
        lastBaseUpdate: null,
        shared: {
            pending: null,
            interleaved: null,
            lanes: 0
        },
        effects: null
    };
}
function lh(a, b) {
    a = a.updateQueue;
    b.updateQueue === a && (b.updateQueue = {
        baseState: a.baseState,
        firstBaseUpdate: a.firstBaseUpdate,
        lastBaseUpdate: a.lastBaseUpdate,
        shared: a.shared,
        effects: a.effects
    });
}
function mh(a, b) {
    return {
        eventTime: a,
        lane: b,
        tag: 0,
        payload: null,
        callback: null,
        next: null
    };
}
function nh(a, b, c) {
    var d = a.updateQueue;
    if (null === d) return null;
    d = d.shared;
    if (0 !== (K & 2)) {
        var e = d.pending;
        null === e ? b.next = b : (b.next = e.next, e.next = b);
        d.pending = b;
        return ih(a, c);
    }
    e = d.interleaved;
    null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
    d.interleaved = b;
    return ih(a, c);
}
function oh(a, b, c) {
    b = b.updateQueue;
    if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
        var d = b.lanes;
        d &= a.pendingLanes;
        c |= d;
        b.lanes = c;
        Cc(a, c);
    }
}
function ph(a, b) {
    var c = a.updateQueue, d = a.alternate;
    if (null !== d && (d = d.updateQueue, c === d)) {
        var e = null, f = null;
        c = c.firstBaseUpdate;
        if (null !== c) {
            do {
                var g = {
                    eventTime: c.eventTime,
                    lane: c.lane,
                    tag: c.tag,
                    payload: c.payload,
                    callback: c.callback,
                    next: null
                };
                null === f ? e = f = g : f = f.next = g;
                c = c.next;
            }while (null !== c)
            null === f ? e = f = b : f = f.next = b;
        } else e = f = b;
        c = {
            baseState: d.baseState,
            firstBaseUpdate: e,
            lastBaseUpdate: f,
            shared: d.shared,
            effects: d.effects
        };
        a.updateQueue = c;
        return;
    }
    a = c.lastBaseUpdate;
    null === a ? c.firstBaseUpdate = b : a.next = b;
    c.lastBaseUpdate = b;
}
function qh(a, b, c, d) {
    var e = a.updateQueue;
    jh = !1;
    var f = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
    if (null !== h) {
        e.shared.pending = null;
        var k = h, l = k.next;
        k.next = null;
        null === g ? f = l : g.next = l;
        g = k;
        var m = a.alternate;
        null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l : h.next = l, m.lastBaseUpdate = k));
    }
    if (null !== f) {
        var q = e.baseState;
        g = 0;
        m = l = k = null;
        h = f;
        do {
            var r = h.lane, y = h.eventTime;
            if ((d & r) === r) {
                null !== m && (m = m.next = {
                    eventTime: y,
                    lane: 0,
                    tag: h.tag,
                    payload: h.payload,
                    callback: h.callback,
                    next: null
                });
                a: {
                    var n = a, t = h;
                    r = b;
                    y = c;
                    switch(t.tag){
                        case 1:
                            n = t.payload;
                            if ("function" === typeof n) {
                                q = n.call(y, q, r);
                                break a;
                            }
                            q = n;
                            break a;
                        case 3:
                            n.flags = n.flags & -65537 | 128;
                        case 0:
                            n = t.payload;
                            r = "function" === typeof n ? n.call(y, q, r) : n;
                            if (null === r || void 0 === r) break a;
                            q = A({}, q, r);
                            break a;
                        case 2:
                            jh = !0;
                    }
                }
                null !== h.callback && 0 !== h.lane && (a.flags |= 64, r = e.effects, null === r ? e.effects = [
                    h
                ] : r.push(h));
            } else y = {
                eventTime: y,
                lane: r,
                tag: h.tag,
                payload: h.payload,
                callback: h.callback,
                next: null
            }, null === m ? (l = m = y, k = q) : m = m.next = y, g |= r;
            h = h.next;
            if (null === h) {
                if (h = e.shared.pending, null === h) break;
                else r = h, h = r.next, r.next = null, e.lastBaseUpdate = r, e.shared.pending = null;
            }
        }while (1)
        null === m && (k = q);
        e.baseState = k;
        e.firstBaseUpdate = l;
        e.lastBaseUpdate = m;
        b = e.shared.interleaved;
        if (null !== b) {
            e = b;
            do g |= e.lane, e = e.next;
            while (e !== b)
        } else null === f && (e.shared.lanes = 0);
        rh |= g;
        a.lanes = g;
        a.memoizedState = q;
    }
}
function sh(a, b, c) {
    a = b.effects;
    b.effects = null;
    if (null !== a) for(b = 0; b < a.length; b++){
        var d = a[b], e = d.callback;
        if (null !== e) {
            d.callback = null;
            d = c;
            if ("function" !== typeof e) throw Error(p(191, e));
            e.call(d);
        }
    }
}
var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
function xh(a) {
    if (a === th) throw Error(p(174));
    return a;
}
function yh(a, b) {
    G(wh, b);
    G(vh, a);
    G(uh, th);
    a = b.nodeType;
    switch(a){
        case 9:
        case 11:
            b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
            break;
        default:
            a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
    }
    E(uh);
    G(uh, b);
}
function zh() {
    E(uh);
    E(vh);
    E(wh);
}
function Ah(a) {
    xh(wh.current);
    var b = xh(uh.current);
    var c = lb(b, a.type);
    b !== c && (G(vh, a), G(uh, c));
}
function Bh(a) {
    vh.current === a && (E(uh), E(vh));
}
var L = Uf(0);
function Ch(a) {
    for(var b = a; null !== b;){
        if (13 === b.tag) {
            var c = b.memoizedState;
            if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
        } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
            if (0 !== (b.flags & 128)) return b;
        } else if (null !== b.child) {
            b.child.return = b;
            b = b.child;
            continue;
        }
        if (b === a) break;
        for(; null === b.sibling;){
            if (null === b.return || b.return === a) return null;
            b = b.return;
        }
        b.sibling.return = b.return;
        b = b.sibling;
    }
    return null;
}
var Dh = [];
function Eh() {
    for(var a = 0; a < Dh.length; a++)Dh[a]._workInProgressVersionPrimary = null;
    Dh.length = 0;
}
var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = !1, Jh = !1, Kh = 0, Lh = 0;
function P() {
    throw Error(p(321));
}
function Mh(a, b) {
    if (null === b) return !1;
    for(var c = 0; c < b.length && c < a.length; c++)if (!He(a[c], b[c])) return !1;
    return !0;
}
function Nh(a, b, c, d, e, f) {
    Hh = f;
    M = b;
    b.memoizedState = null;
    b.updateQueue = null;
    b.lanes = 0;
    Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
    a = c(d, e);
    if (Jh) {
        f = 0;
        do {
            Jh = !1;
            Kh = 0;
            if (25 <= f) throw Error(p(301));
            f += 1;
            O = N = null;
            b.updateQueue = null;
            Fh.current = Qh;
            a = c(d, e);
        }while (Jh)
    }
    Fh.current = Rh;
    b = null !== N && null !== N.next;
    Hh = 0;
    O = N = M = null;
    Ih = !1;
    if (b) throw Error(p(300));
    return a;
}
function Sh() {
    var a = 0 !== Kh;
    Kh = 0;
    return a;
}
function Th() {
    var a = {
        memoizedState: null,
        baseState: null,
        baseQueue: null,
        queue: null,
        next: null
    };
    null === O ? M.memoizedState = O = a : O = O.next = a;
    return O;
}
function Uh() {
    if (null === N) {
        var a = M.alternate;
        a = null !== a ? a.memoizedState : null;
    } else a = N.next;
    var b = null === O ? M.memoizedState : O.next;
    if (null !== b) O = b, N = a;
    else {
        if (null === a) throw Error(p(310));
        N = a;
        a = {
            memoizedState: N.memoizedState,
            baseState: N.baseState,
            baseQueue: N.baseQueue,
            queue: N.queue,
            next: null
        };
        null === O ? M.memoizedState = O = a : O = O.next = a;
    }
    return O;
}
function Vh(a, b) {
    return "function" === typeof b ? b(a) : b;
}
function Wh(a) {
    var b = Uh(), c = b.queue;
    if (null === c) throw Error(p(311));
    c.lastRenderedReducer = a;
    var d = N, e = d.baseQueue, f = c.pending;
    if (null !== f) {
        if (null !== e) {
            var g = e.next;
            e.next = f.next;
            f.next = g;
        }
        d.baseQueue = e = f;
        c.pending = null;
    }
    if (null !== e) {
        f = e.next;
        d = d.baseState;
        var h = g = null, k = null, l = f;
        do {
            var m = l.lane;
            if ((Hh & m) === m) null !== k && (k = k.next = {
                lane: 0,
                action: l.action,
                hasEagerState: l.hasEagerState,
                eagerState: l.eagerState,
                next: null
            }), d = l.hasEagerState ? l.eagerState : a(d, l.action);
            else {
                var q = {
                    lane: m,
                    action: l.action,
                    hasEagerState: l.hasEagerState,
                    eagerState: l.eagerState,
                    next: null
                };
                null === k ? (h = k = q, g = d) : k = k.next = q;
                M.lanes |= m;
                rh |= m;
            }
            l = l.next;
        }while (null !== l && l !== f)
        null === k ? g = d : k.next = h;
        He(d, b.memoizedState) || (dh = !0);
        b.memoizedState = d;
        b.baseState = g;
        b.baseQueue = k;
        c.lastRenderedState = d;
    }
    a = c.interleaved;
    if (null !== a) {
        e = a;
        do f = e.lane, M.lanes |= f, rh |= f, e = e.next;
        while (e !== a)
    } else null === e && (c.lanes = 0);
    return [
        b.memoizedState,
        c.dispatch
    ];
}
function Xh(a) {
    var b = Uh(), c = b.queue;
    if (null === c) throw Error(p(311));
    c.lastRenderedReducer = a;
    var d = c.dispatch, e = c.pending, f = b.memoizedState;
    if (null !== e) {
        c.pending = null;
        var g = e = e.next;
        do f = a(f, g.action), g = g.next;
        while (g !== e)
        He(f, b.memoizedState) || (dh = !0);
        b.memoizedState = f;
        null === b.baseQueue && (b.baseState = f);
        c.lastRenderedState = f;
    }
    return [
        f,
        d
    ];
}
function Yh() {}
function Zh(a, b) {
    var c = M, d = Uh(), e = b(), f = !He(d.memoizedState, e);
    f && (d.memoizedState = e, dh = !0);
    d = d.queue;
    $h(ai.bind(null, c, d, a), [
        a
    ]);
    if (d.getSnapshot !== b || f || null !== O && O.memoizedState.tag & 1) {
        c.flags |= 2048;
        bi(9, ci.bind(null, c, d, e, b), void 0, null);
        if (null === Q) throw Error(p(349));
        0 !== (Hh & 30) || di(c, b, e);
    }
    return e;
}
function di(a, b, c) {
    a.flags |= 16384;
    a = {
        getSnapshot: b,
        value: c
    };
    b = M.updateQueue;
    null === b ? (b = {
        lastEffect: null,
        stores: null
    }, M.updateQueue = b, b.stores = [
        a
    ]) : (c = b.stores, null === c ? b.stores = [
        a
    ] : c.push(a));
}
function ci(a, b, c, d) {
    b.value = c;
    b.getSnapshot = d;
    ei(b) && fi(a);
}
function ai(a, b, c) {
    return c(function() {
        ei(b) && fi(a);
    });
}
function ei(a) {
    var b = a.getSnapshot;
    a = a.value;
    try {
        var c = b();
        return !He(a, c);
    } catch (d) {
        return !0;
    }
}
function fi(a) {
    var b = ih(a, 1);
    null !== b && gi(b, a, 1, -1);
}
function hi(a) {
    var b = Th();
    "function" === typeof a && (a = a());
    b.memoizedState = b.baseState = a;
    a = {
        pending: null,
        interleaved: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: Vh,
        lastRenderedState: a
    };
    b.queue = a;
    a = a.dispatch = ii.bind(null, M, a);
    return [
        b.memoizedState,
        a
    ];
}
function bi(a, b, c, d) {
    a = {
        tag: a,
        create: b,
        destroy: c,
        deps: d,
        next: null
    };
    b = M.updateQueue;
    null === b ? (b = {
        lastEffect: null,
        stores: null
    }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
    return a;
}
function ji() {
    return Uh().memoizedState;
}
function ki(a, b, c, d) {
    var e = Th();
    M.flags |= a;
    e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
}
function li(a, b, c, d) {
    var e = Uh();
    d = void 0 === d ? null : d;
    var f = void 0;
    if (null !== N) {
        var g = N.memoizedState;
        f = g.destroy;
        if (null !== d && Mh(d, g.deps)) {
            e.memoizedState = bi(b, c, f, d);
            return;
        }
    }
    M.flags |= a;
    e.memoizedState = bi(1 | b, c, f, d);
}
function mi(a, b) {
    return ki(8390656, 8, a, b);
}
function $h(a, b) {
    return li(2048, 8, a, b);
}
function ni(a, b) {
    return li(4, 2, a, b);
}
function oi(a, b) {
    return li(4, 4, a, b);
}
function pi(a, b) {
    if ("function" === typeof b) return a = a(), b(a), function() {
        b(null);
    };
    if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
        b.current = null;
    };
}
function qi(a, b, c) {
    c = null !== c && void 0 !== c ? c.concat([
        a
    ]) : null;
    return li(4, 4, pi.bind(null, b, a), c);
}
function ri() {}
function si(a, b) {
    var c = Uh();
    b = void 0 === b ? null : b;
    var d = c.memoizedState;
    if (null !== d && null !== b && Mh(b, d[1])) return d[0];
    c.memoizedState = [
        a,
        b
    ];
    return a;
}
function ti(a, b) {
    var c = Uh();
    b = void 0 === b ? null : b;
    var d = c.memoizedState;
    if (null !== d && null !== b && Mh(b, d[1])) return d[0];
    a = a();
    c.memoizedState = [
        a,
        b
    ];
    return a;
}
function ui(a, b, c) {
    if (0 === (Hh & 21)) return a.baseState && (a.baseState = !1, dh = !0), a.memoizedState = c;
    He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = !0);
    return b;
}
function vi(a, b) {
    var c = C;
    C = 0 !== c && 4 > c ? c : 4;
    a(!0);
    var d = Gh.transition;
    Gh.transition = {};
    try {
        a(!1), b();
    } finally{
        C = c, Gh.transition = d;
    }
}
function wi() {
    return Uh().memoizedState;
}
function xi(a, b, c) {
    var d = yi(a);
    c = {
        lane: d,
        action: c,
        hasEagerState: !1,
        eagerState: null,
        next: null
    };
    if (zi(a)) Ai(b, c);
    else if (c = hh(a, b, c, d), null !== c) {
        var e = R();
        gi(c, a, d, e);
        Bi(c, b, d);
    }
}
function ii(a, b, c) {
    var d = yi(a), e = {
        lane: d,
        action: c,
        hasEagerState: !1,
        eagerState: null,
        next: null
    };
    if (zi(a)) Ai(b, e);
    else {
        var f = a.alternate;
        if (0 === a.lanes && (null === f || 0 === f.lanes) && (f = b.lastRenderedReducer, null !== f)) try {
            var g = b.lastRenderedState, h = f(g, c);
            e.hasEagerState = !0;
            e.eagerState = h;
            if (He(h, g)) {
                var k = b.interleaved;
                null === k ? (e.next = e, gh(b)) : (e.next = k.next, k.next = e);
                b.interleaved = e;
                return;
            }
        } catch (l) {} finally{}
        c = hh(a, b, e, d);
        null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
    }
}
function zi(a) {
    var b = a.alternate;
    return a === M || null !== b && b === M;
}
function Ai(a, b) {
    Jh = Ih = !0;
    var c = a.pending;
    null === c ? b.next = b : (b.next = c.next, c.next = b);
    a.pending = b;
}
function Bi(a, b, c) {
    if (0 !== (c & 4194240)) {
        var d = b.lanes;
        d &= a.pendingLanes;
        c |= d;
        b.lanes = c;
        Cc(a, c);
    }
}
var Rh = {
    readContext: eh,
    useCallback: P,
    useContext: P,
    useEffect: P,
    useImperativeHandle: P,
    useInsertionEffect: P,
    useLayoutEffect: P,
    useMemo: P,
    useReducer: P,
    useRef: P,
    useState: P,
    useDebugValue: P,
    useDeferredValue: P,
    useTransition: P,
    useMutableSource: P,
    useSyncExternalStore: P,
    useId: P,
    unstable_isNewReconciler: !1
}, Oh = {
    readContext: eh,
    useCallback: function(a, b) {
        Th().memoizedState = [
            a,
            void 0 === b ? null : b
        ];
        return a;
    },
    useContext: eh,
    useEffect: mi,
    useImperativeHandle: function(a, b, c) {
        c = null !== c && void 0 !== c ? c.concat([
            a
        ]) : null;
        return ki(4194308, 4, pi.bind(null, b, a), c);
    },
    useLayoutEffect: function(a, b) {
        return ki(4194308, 4, a, b);
    },
    useInsertionEffect: function(a, b) {
        return ki(4, 2, a, b);
    },
    useMemo: function(a, b) {
        var c = Th();
        b = void 0 === b ? null : b;
        a = a();
        c.memoizedState = [
            a,
            b
        ];
        return a;
    },
    useReducer: function(a, b, c) {
        var d = Th();
        b = void 0 !== c ? c(b) : b;
        d.memoizedState = d.baseState = b;
        a = {
            pending: null,
            interleaved: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: a,
            lastRenderedState: b
        };
        d.queue = a;
        a = a.dispatch = xi.bind(null, M, a);
        return [
            d.memoizedState,
            a
        ];
    },
    useRef: function(a) {
        var b = Th();
        a = {
            current: a
        };
        return b.memoizedState = a;
    },
    useState: hi,
    useDebugValue: ri,
    useDeferredValue: function(a) {
        return Th().memoizedState = a;
    },
    useTransition: function() {
        var a = hi(!1), b = a[0];
        a = vi.bind(null, a[1]);
        Th().memoizedState = a;
        return [
            b,
            a
        ];
    },
    useMutableSource: function() {},
    useSyncExternalStore: function(a, b, c) {
        var d = M, e = Th();
        if (I) {
            if (void 0 === c) throw Error(p(407));
            c = c();
        } else {
            c = b();
            if (null === Q) throw Error(p(349));
            0 !== (Hh & 30) || di(d, b, c);
        }
        e.memoizedState = c;
        var f = {
            value: c,
            getSnapshot: b
        };
        e.queue = f;
        mi(ai.bind(null, d, f, a), [
            a
        ]);
        d.flags |= 2048;
        bi(9, ci.bind(null, d, f, c, b), void 0, null);
        return c;
    },
    useId: function() {
        var a = Th(), b = Q.identifierPrefix;
        if (I) {
            var c = sg;
            var d = rg;
            c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
            b = ":" + b + "R" + c;
            c = Kh++;
            0 < c && (b += "H" + c.toString(32));
            b += ":";
        } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
        return a.memoizedState = b;
    },
    unstable_isNewReconciler: !1
}, Ph = {
    readContext: eh,
    useCallback: si,
    useContext: eh,
    useEffect: $h,
    useImperativeHandle: qi,
    useInsertionEffect: ni,
    useLayoutEffect: oi,
    useMemo: ti,
    useReducer: Wh,
    useRef: ji,
    useState: function() {
        return Wh(Vh);
    },
    useDebugValue: ri,
    useDeferredValue: function(a) {
        var b = Uh();
        return ui(b, N.memoizedState, a);
    },
    useTransition: function() {
        var a = Wh(Vh)[0], b = Uh().memoizedState;
        return [
            a,
            b
        ];
    },
    useMutableSource: Yh,
    useSyncExternalStore: Zh,
    useId: wi,
    unstable_isNewReconciler: !1
}, Qh = {
    readContext: eh,
    useCallback: si,
    useContext: eh,
    useEffect: $h,
    useImperativeHandle: qi,
    useInsertionEffect: ni,
    useLayoutEffect: oi,
    useMemo: ti,
    useReducer: Xh,
    useRef: ji,
    useState: function() {
        return Xh(Vh);
    },
    useDebugValue: ri,
    useDeferredValue: function(a) {
        var b = Uh();
        return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
    },
    useTransition: function() {
        var a = Xh(Vh)[0], b = Uh().memoizedState;
        return [
            a,
            b
        ];
    },
    useMutableSource: Yh,
    useSyncExternalStore: Zh,
    useId: wi,
    unstable_isNewReconciler: !1
};
function Ci(a, b) {
    if (a && a.defaultProps) {
        b = A({}, b);
        a = a.defaultProps;
        for(var c in a)void 0 === b[c] && (b[c] = a[c]);
        return b;
    }
    return b;
}
function Di(a, b, c, d) {
    b = a.memoizedState;
    c = c(d, b);
    c = null === c || void 0 === c ? b : A({}, b, c);
    a.memoizedState = c;
    0 === a.lanes && (a.updateQueue.baseState = c);
}
var Ei = {
    isMounted: function(a) {
        return (a = a._reactInternals) ? Vb(a) === a : !1;
    },
    enqueueSetState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
    },
    enqueueReplaceState: function(a, b, c) {
        a = a._reactInternals;
        var d = R(), e = yi(a), f = mh(d, e);
        f.tag = 1;
        f.payload = b;
        void 0 !== c && null !== c && (f.callback = c);
        b = nh(a, f, e);
        null !== b && (gi(b, a, e, d), oh(b, a, e));
    },
    enqueueForceUpdate: function(a, b) {
        a = a._reactInternals;
        var c = R(), d = yi(a), e = mh(c, d);
        e.tag = 2;
        void 0 !== b && null !== b && (e.callback = b);
        b = nh(a, e, d);
        null !== b && (gi(b, a, d, c), oh(b, a, d));
    }
};
function Fi(a, b, c, d, e, f, g) {
    a = a.stateNode;
    return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f) : !0;
}
function Gi(a, b, c) {
    var d = !1, e = Vf;
    var f = b.contextType;
    "object" === typeof f && null !== f ? f = eh(f) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
    b = new b(c, f);
    a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
    b.updater = Ei;
    a.stateNode = b;
    b._reactInternals = a;
    d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f);
    return b;
}
function Hi(a, b, c, d) {
    a = b.state;
    "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
    "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
    b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
}
function Ii(a, b, c, d) {
    var e = a.stateNode;
    e.props = c;
    e.state = a.memoizedState;
    e.refs = {};
    kh(a);
    var f = b.contextType;
    "object" === typeof f && null !== f ? e.context = eh(f) : (f = Zf(b) ? Xf : H.current, e.context = Yf(a, f));
    e.state = a.memoizedState;
    f = b.getDerivedStateFromProps;
    "function" === typeof f && (Di(a, b, f, c), e.state = a.memoizedState);
    "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
    "function" === typeof e.componentDidMount && (a.flags |= 4194308);
}
function Ji(a, b) {
    try {
        var c = "", d = b;
        do c += Pa(d), d = d.return;
        while (d)
        var e = c;
    } catch (f) {
        e = "\nError generating stack: " + f.message + "\n" + f.stack;
    }
    return {
        value: a,
        source: b,
        stack: e,
        digest: null
    };
}
function Ki(a, b, c) {
    return {
        value: a,
        source: null,
        stack: null != c ? c : null,
        digest: null != b ? b : null
    };
}
function Li(a, b) {
    try {
        console.error(b.value);
    } catch (c) {
        setTimeout(function() {
            throw c;
        });
    }
}
var Mi = "function" === typeof WeakMap ? WeakMap : Map;
function Ni(a, b, c) {
    c = mh(-1, c);
    c.tag = 3;
    c.payload = {
        element: null
    };
    var d = b.value;
    c.callback = function() {
        Oi || (Oi = !0, Pi = d);
        Li(a, b);
    };
    return c;
}
function Qi(a, b, c) {
    c = mh(-1, c);
    c.tag = 3;
    var d = a.type.getDerivedStateFromError;
    if ("function" === typeof d) {
        var e = b.value;
        c.payload = function() {
            return d(e);
        };
        c.callback = function() {
            Li(a, b);
        };
    }
    var f = a.stateNode;
    null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
        Li(a, b);
        "function" !== typeof d && (null === Ri ? Ri = new Set([
            this
        ]) : Ri.add(this));
        var c = b.stack;
        this.componentDidCatch(b.value, {
            componentStack: null !== c ? c : ""
        });
    });
    return c;
}
function Si(a, b, c) {
    var d = a.pingCache;
    if (null === d) {
        d = a.pingCache = new Mi;
        var e = new Set;
        d.set(b, e);
    } else e = d.get(b), void 0 === e && (e = new Set, d.set(b, e));
    e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
}
function Ui(a) {
    do {
        var b;
        if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? !0 : !1 : !0;
        if (b) return a;
        a = a.return;
    }while (null !== a)
    return null;
}
function Vi(a, b, c, d, e) {
    if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
    a.flags |= 65536;
    a.lanes = e;
    return a;
}
var Wi = ua.ReactCurrentOwner, dh = !1;
function Xi(a, b, c, d) {
    b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
}
function Yi(a, b, c, d, e) {
    c = c.render;
    var f = b.ref;
    ch(b, e);
    d = Nh(a, b, c, d, f, e);
    c = Sh();
    if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
    I && c && vg(b);
    b.flags |= 1;
    Xi(a, b, d, e);
    return b.child;
}
function $i(a, b, c, d, e) {
    if (null === a) {
        var f = c.type;
        if ("function" === typeof f && !aj(f) && void 0 === f.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f, bj(a, b, f, d, e);
        a = Rg(c.type, null, d, b, b.mode, e);
        a.ref = b.ref;
        a.return = b;
        return b.child = a;
    }
    f = a.child;
    if (0 === (a.lanes & e)) {
        var g = f.memoizedProps;
        c = c.compare;
        c = null !== c ? c : Ie;
        if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
    }
    b.flags |= 1;
    a = Pg(f, d);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
}
function bj(a, b, c, d, e) {
    if (null !== a) {
        var f = a.memoizedProps;
        if (Ie(f, d) && a.ref === b.ref) {
            if (dh = !1, b.pendingProps = d = f, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = !0);
            else return b.lanes = a.lanes, Zi(a, b, e);
        }
    }
    return cj(a, b, c, d, e);
}
function dj(a, b, c) {
    var d = b.pendingProps, e = d.children, f = null !== a ? a.memoizedState : null;
    if ("hidden" === d.mode) {
        if (0 === (b.mode & 1)) b.memoizedState = {
            baseLanes: 0,
            cachePool: null,
            transitions: null
        }, G(ej, fj), fj |= c;
        else {
            if (0 === (c & 1073741824)) return a = null !== f ? f.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = {
                baseLanes: a,
                cachePool: null,
                transitions: null
            }, b.updateQueue = null, G(ej, fj), fj |= a, null;
            b.memoizedState = {
                baseLanes: 0,
                cachePool: null,
                transitions: null
            };
            d = null !== f ? f.baseLanes : c;
            G(ej, fj);
            fj |= d;
        }
    } else null !== f ? (d = f.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
    Xi(a, b, e, c);
    return b.child;
}
function gj(a, b) {
    var c = b.ref;
    if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
}
function cj(a, b, c, d, e) {
    var f = Zf(c) ? Xf : H.current;
    f = Yf(b, f);
    ch(b, e);
    c = Nh(a, b, c, d, f, e);
    d = Sh();
    if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
    I && d && vg(b);
    b.flags |= 1;
    Xi(a, b, c, e);
    return b.child;
}
function hj(a, b, c, d, e) {
    if (Zf(c)) {
        var f = !0;
        cg(b);
    } else f = !1;
    ch(b, e);
    if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = !0;
    else if (null === a) {
        var g = b.stateNode, h = b.memoizedProps;
        g.props = h;
        var k = g.context, l = c.contextType;
        "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
        var m = c.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
        q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
        jh = !1;
        var r = b.memoizedState;
        g.state = r;
        qh(b, d, g, e);
        k = b.memoizedState;
        h !== d || r !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c, m, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = !1);
    } else {
        g = b.stateNode;
        lh(a, b);
        h = b.memoizedProps;
        l = b.type === b.elementType ? h : Ci(b.type, h);
        g.props = l;
        q = b.pendingProps;
        r = g.context;
        k = c.contextType;
        "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
        var y = c.getDerivedStateFromProps;
        (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r !== k) && Hi(b, g, d, k);
        jh = !1;
        r = b.memoizedState;
        g.state = r;
        qh(b, d, g, e);
        var n = b.memoizedState;
        h !== q || r !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n = b.memoizedState), (l = jh || Fi(b, c, l, d, r, n, k) || !1) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), d = !1);
    }
    return jj(a, b, c, d, f, e);
}
function jj(a, b, c, d, e, f) {
    gj(a, b);
    var g = 0 !== (b.flags & 128);
    if (!d && !g) return e && dg(b, c, !1), Zi(a, b, f);
    d = b.stateNode;
    Wi.current = b;
    var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
    b.flags |= 1;
    null !== a && g ? (b.child = Ug(b, a.child, null, f), b.child = Ug(b, null, h, f)) : Xi(a, b, h, f);
    b.memoizedState = d.state;
    e && dg(b, c, !0);
    return b.child;
}
function kj(a) {
    var b = a.stateNode;
    b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, !1);
    yh(a, b.containerInfo);
}
function lj(a, b, c, d, e) {
    Ig();
    Jg(e);
    b.flags |= 256;
    Xi(a, b, c, d);
    return b.child;
}
var mj = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0
};
function nj(a) {
    return {
        baseLanes: a,
        cachePool: null,
        transitions: null
    };
}
function oj(a, b, c) {
    var d = b.pendingProps, e = L.current, f = !1, g = 0 !== (b.flags & 128), h;
    (h = g) || (h = null !== a && null === a.memoizedState ? !1 : 0 !== (e & 2));
    if (h) f = !0, b.flags &= -129;
    else if (null === a || null !== a.memoizedState) e |= 1;
    G(L, e & 1);
    if (null === a) {
        Eg(b);
        a = b.memoizedState;
        if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
        g = d.children;
        a = d.fallback;
        return f ? (d = b.mode, f = b.child, g = {
            mode: "hidden",
            children: g
        }, 0 === (d & 1) && null !== f ? (f.childLanes = 0, f.pendingProps = g) : f = pj(g, d, 0, null), a = Tg(a, d, c, null), f.return = b, a.return = b, f.sibling = a, b.child = f, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
    }
    e = a.memoizedState;
    if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
    if (f) {
        f = d.fallback;
        g = b.mode;
        e = a.child;
        h = e.sibling;
        var k = {
            mode: "hidden",
            children: d.children
        };
        0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e, k), d.subtreeFlags = e.subtreeFlags & 14680064);
        null !== h ? f = Pg(h, f) : (f = Tg(f, g, c, null), f.flags |= 2);
        f.return = b;
        d.return = b;
        d.sibling = f;
        b.child = d;
        d = f;
        f = b.child;
        g = a.child.memoizedState;
        g = null === g ? nj(c) : {
            baseLanes: g.baseLanes | c,
            cachePool: null,
            transitions: g.transitions
        };
        f.memoizedState = g;
        f.childLanes = a.childLanes & ~c;
        b.memoizedState = mj;
        return d;
    }
    f = a.child;
    a = f.sibling;
    d = Pg(f, {
        mode: "visible",
        children: d.children
    });
    0 === (b.mode & 1) && (d.lanes = c);
    d.return = b;
    d.sibling = null;
    null !== a && (c = b.deletions, null === c ? (b.deletions = [
        a
    ], b.flags |= 16) : c.push(a));
    b.child = d;
    b.memoizedState = null;
    return d;
}
function qj(a, b) {
    b = pj({
        mode: "visible",
        children: b
    }, a.mode, 0, null);
    b.return = a;
    return a.child = b;
}
function sj(a, b, c, d) {
    null !== d && Jg(d);
    Ug(b, a.child, null, c);
    a = qj(b, b.pendingProps.children);
    a.flags |= 2;
    b.memoizedState = null;
    return a;
}
function rj(a, b, c, d, e, f, g) {
    if (c) {
        if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
        if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
        f = d.fallback;
        e = b.mode;
        d = pj({
            mode: "visible",
            children: d.children
        }, e, 0, null);
        f = Tg(f, e, g, null);
        f.flags |= 2;
        d.return = b;
        f.return = b;
        d.sibling = f;
        b.child = d;
        0 !== (b.mode & 1) && Ug(b, a.child, null, g);
        b.child.memoizedState = nj(g);
        b.memoizedState = mj;
        return f;
    }
    if (0 === (b.mode & 1)) return sj(a, b, g, null);
    if ("$!" === e.data) {
        d = e.nextSibling && e.nextSibling.dataset;
        if (d) var h = d.dgst;
        d = h;
        f = Error(p(419));
        d = Ki(f, d, void 0);
        return sj(a, b, g, d);
    }
    h = 0 !== (g & a.childLanes);
    if (dh || h) {
        d = Q;
        if (null !== d) {
            switch(g & -g){
                case 4:
                    e = 2;
                    break;
                case 16:
                    e = 8;
                    break;
                case 64:
                case 128:
                case 256:
                case 512:
                case 1024:
                case 2048:
                case 4096:
                case 8192:
                case 16384:
                case 32768:
                case 65536:
                case 131072:
                case 262144:
                case 524288:
                case 1048576:
                case 2097152:
                case 4194304:
                case 8388608:
                case 16777216:
                case 33554432:
                case 67108864:
                    e = 32;
                    break;
                case 536870912:
                    e = 268435456;
                    break;
                default:
                    e = 0;
            }
            e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
            0 !== e && e !== f.retryLane && (f.retryLane = e, ih(a, e), gi(d, a, e, -1));
        }
        tj();
        d = Ki(Error(p(421)));
        return sj(a, b, g, d);
    }
    if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
    a = f.treeContext;
    yg = Lf(e.nextSibling);
    xg = b;
    I = !0;
    zg = null;
    null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
    b = qj(b, d.children);
    b.flags |= 4096;
    return b;
}
function vj(a, b, c) {
    a.lanes |= b;
    var d = a.alternate;
    null !== d && (d.lanes |= b);
    bh(a.return, b, c);
}
function wj(a, b, c, d, e) {
    var f = a.memoizedState;
    null === f ? a.memoizedState = {
        isBackwards: b,
        rendering: null,
        renderingStartTime: 0,
        last: d,
        tail: c,
        tailMode: e
    } : (f.isBackwards = b, f.rendering = null, f.renderingStartTime = 0, f.last = d, f.tail = c, f.tailMode = e);
}
function xj(a, b, c) {
    var d = b.pendingProps, e = d.revealOrder, f = d.tail;
    Xi(a, b, d.children, c);
    d = L.current;
    if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
    else {
        if (null !== a && 0 !== (a.flags & 128)) a: for(a = b.child; null !== a;){
            if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
            else if (19 === a.tag) vj(a, c, b);
            else if (null !== a.child) {
                a.child.return = a;
                a = a.child;
                continue;
            }
            if (a === b) break a;
            for(; null === a.sibling;){
                if (null === a.return || a.return === b) break a;
                a = a.return;
            }
            a.sibling.return = a.return;
            a = a.sibling;
        }
        d &= 1;
    }
    G(L, d);
    if (0 === (b.mode & 1)) b.memoizedState = null;
    else switch(e){
        case "forwards":
            c = b.child;
            for(e = null; null !== c;)a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
            c = e;
            null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
            wj(b, !1, e, c, f);
            break;
        case "backwards":
            c = null;
            e = b.child;
            for(b.child = null; null !== e;){
                a = e.alternate;
                if (null !== a && null === Ch(a)) {
                    b.child = e;
                    break;
                }
                a = e.sibling;
                e.sibling = c;
                c = e;
                e = a;
            }
            wj(b, !0, c, null, f);
            break;
        case "together":
            wj(b, !1, null, null, void 0);
            break;
        default:
            b.memoizedState = null;
    }
    return b.child;
}
function ij(a, b) {
    0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
}
function Zi(a, b, c) {
    null !== a && (b.dependencies = a.dependencies);
    rh |= b.lanes;
    if (0 === (c & b.childLanes)) return null;
    if (null !== a && b.child !== a.child) throw Error(p(153));
    if (null !== b.child) {
        a = b.child;
        c = Pg(a, a.pendingProps);
        b.child = c;
        for(c.return = b; null !== a.sibling;)a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
        c.sibling = null;
    }
    return b.child;
}
function yj(a, b, c) {
    switch(b.tag){
        case 3:
            kj(b);
            Ig();
            break;
        case 5:
            Ah(b);
            break;
        case 1:
            Zf(b.type) && cg(b);
            break;
        case 4:
            yh(b, b.stateNode.containerInfo);
            break;
        case 10:
            var d = b.type._context, e = b.memoizedProps.value;
            G(Wg, d._currentValue);
            d._currentValue = e;
            break;
        case 13:
            d = b.memoizedState;
            if (null !== d) {
                if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
                if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
                G(L, L.current & 1);
                a = Zi(a, b, c);
                return null !== a ? a.sibling : null;
            }
            G(L, L.current & 1);
            break;
        case 19:
            d = 0 !== (c & b.childLanes);
            if (0 !== (a.flags & 128)) {
                if (d) return xj(a, b, c);
                b.flags |= 128;
            }
            e = b.memoizedState;
            null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
            G(L, L.current);
            if (d) break;
            else return null;
        case 22:
        case 23:
            return b.lanes = 0, dj(a, b, c);
    }
    return Zi(a, b, c);
}
var zj, Aj, Bj, Cj;
zj = function(a, b) {
    for(var c = b.child; null !== c;){
        if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
        else if (4 !== c.tag && null !== c.child) {
            c.child.return = c;
            c = c.child;
            continue;
        }
        if (c === b) break;
        for(; null === c.sibling;){
            if (null === c.return || c.return === b) return;
            c = c.return;
        }
        c.sibling.return = c.return;
        c = c.sibling;
    }
};
Aj = function() {};
Bj = function(a, b, c, d) {
    var e = a.memoizedProps;
    if (e !== d) {
        a = b.stateNode;
        xh(uh.current);
        var f = null;
        switch(c){
            case "input":
                e = Ya(a, e);
                d = Ya(a, d);
                f = [];
                break;
            case "select":
                e = A({}, e, {
                    value: void 0
                });
                d = A({}, d, {
                    value: void 0
                });
                f = [];
                break;
            case "textarea":
                e = gb(a, e);
                d = gb(a, d);
                f = [];
                break;
            default:
                "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
        }
        ub(c, d);
        var g;
        c = null;
        for(l in e)if (!d.hasOwnProperty(l) && e.hasOwnProperty(l) && null != e[l]) {
            if ("style" === l) {
                var h = e[l];
                for(g in h)h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
            } else "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f || (f = []) : (f = f || []).push(l, null));
        }
        for(l in d){
            var k = d[l];
            h = null != e ? e[l] : void 0;
            if (d.hasOwnProperty(l) && k !== h && (null != k || null != h)) {
                if ("style" === l) {
                    if (h) {
                        for(g in h)!h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
                        for(g in k)k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
                    } else c || (f || (f = []), f.push(l, c)), c = k;
                } else "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f = f || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f = f || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a), f || h === k || (f = [])) : (f = f || []).push(l, k));
            }
        }
        c && (f = f || []).push("style", c);
        var l = f;
        if (b.updateQueue = l) b.flags |= 4;
    }
};
Cj = function(a, b, c, d) {
    c !== d && (b.flags |= 4);
};
function Dj(a, b) {
    if (!I) switch(a.tailMode){
        case "hidden":
            b = a.tail;
            for(var c = null; null !== b;)null !== b.alternate && (c = b), b = b.sibling;
            null === c ? a.tail = null : c.sibling = null;
            break;
        case "collapsed":
            c = a.tail;
            for(var d = null; null !== c;)null !== c.alternate && (d = c), c = c.sibling;
            null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
    }
}
function S(a) {
    var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
    if (b) for(var e = a.child; null !== e;)c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
    else for(e = a.child; null !== e;)c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
    a.subtreeFlags |= d;
    a.childLanes = c;
    return b;
}
function Ej(a, b, c) {
    var d = b.pendingProps;
    wg(b);
    switch(b.tag){
        case 2:
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
            return S(b), null;
        case 1:
            return Zf(b.type) && $f(), S(b), null;
        case 3:
            d = b.stateNode;
            zh();
            E(Wf);
            E(H);
            Eh();
            d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
            if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
            Aj(a, b);
            S(b);
            return null;
        case 5:
            Bh(b);
            var e = xh(wh.current);
            c = b.type;
            if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            else {
                if (!d) {
                    if (null === b.stateNode) throw Error(p(166));
                    S(b);
                    return null;
                }
                a = xh(uh.current);
                if (Gg(b)) {
                    d = b.stateNode;
                    c = b.type;
                    var f = b.memoizedProps;
                    d[Of] = b;
                    d[Pf] = f;
                    a = 0 !== (b.mode & 1);
                    switch(c){
                        case "dialog":
                            D("cancel", d);
                            D("close", d);
                            break;
                        case "iframe":
                        case "object":
                        case "embed":
                            D("load", d);
                            break;
                        case "video":
                        case "audio":
                            for(e = 0; e < lf.length; e++)D(lf[e], d);
                            break;
                        case "source":
                            D("error", d);
                            break;
                        case "img":
                        case "image":
                        case "link":
                            D("error", d);
                            D("load", d);
                            break;
                        case "details":
                            D("toggle", d);
                            break;
                        case "input":
                            Za(d, f);
                            D("invalid", d);
                            break;
                        case "select":
                            d._wrapperState = {
                                wasMultiple: !!f.multiple
                            };
                            D("invalid", d);
                            break;
                        case "textarea":
                            hb(d, f), D("invalid", d);
                    }
                    ub(c, f);
                    e = null;
                    for(var g in f)if (f.hasOwnProperty(g)) {
                        var h = f[g];
                        "children" === g ? "string" === typeof h ? d.textContent !== h && (!0 !== f.suppressHydrationWarning && Af(d.textContent, h, a), e = [
                            "children",
                            h
                        ]) : "number" === typeof h && d.textContent !== "" + h && (!0 !== f.suppressHydrationWarning && Af(d.textContent, h, a), e = [
                            "children",
                            "" + h
                        ]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
                    }
                    switch(c){
                        case "input":
                            Va(d);
                            db(d, f, !0);
                            break;
                        case "textarea":
                            Va(d);
                            jb(d);
                            break;
                        case "select":
                        case "option":
                            break;
                        default:
                            "function" === typeof f.onClick && (d.onclick = Bf);
                    }
                    d = e;
                    b.updateQueue = d;
                    null !== d && (b.flags |= 4);
                } else {
                    g = 9 === e.nodeType ? e : e.ownerDocument;
                    "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
                    "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script>\x3c/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, {
                        is: d.is
                    }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = !0 : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
                    a[Of] = b;
                    a[Pf] = d;
                    zj(a, b, !1, !1);
                    b.stateNode = a;
                    a: {
                        g = vb(c, d);
                        switch(c){
                            case "dialog":
                                D("cancel", a);
                                D("close", a);
                                e = d;
                                break;
                            case "iframe":
                            case "object":
                            case "embed":
                                D("load", a);
                                e = d;
                                break;
                            case "video":
                            case "audio":
                                for(e = 0; e < lf.length; e++)D(lf[e], a);
                                e = d;
                                break;
                            case "source":
                                D("error", a);
                                e = d;
                                break;
                            case "img":
                            case "image":
                            case "link":
                                D("error", a);
                                D("load", a);
                                e = d;
                                break;
                            case "details":
                                D("toggle", a);
                                e = d;
                                break;
                            case "input":
                                Za(a, d);
                                e = Ya(a, d);
                                D("invalid", a);
                                break;
                            case "option":
                                e = d;
                                break;
                            case "select":
                                a._wrapperState = {
                                    wasMultiple: !!d.multiple
                                };
                                e = A({}, d, {
                                    value: void 0
                                });
                                D("invalid", a);
                                break;
                            case "textarea":
                                hb(a, d);
                                e = gb(a, d);
                                D("invalid", a);
                                break;
                            default:
                                e = d;
                        }
                        ub(c, e);
                        h = e;
                        for(f in h)if (h.hasOwnProperty(f)) {
                            var k = h[f];
                            "style" === f ? sb(a, k) : "dangerouslySetInnerHTML" === f ? (k = k ? k.__html : void 0, null != k && nb(a, k)) : "children" === f ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a, k) : "number" === typeof k && ob(a, "" + k) : "suppressContentEditableWarning" !== f && "suppressHydrationWarning" !== f && "autoFocus" !== f && (ea.hasOwnProperty(f) ? null != k && "onScroll" === f && D("scroll", a) : null != k && ta(a, f, k, g));
                        }
                        switch(c){
                            case "input":
                                Va(a);
                                db(a, d, !1);
                                break;
                            case "textarea":
                                Va(a);
                                jb(a);
                                break;
                            case "option":
                                null != d.value && a.setAttribute("value", "" + Sa(d.value));
                                break;
                            case "select":
                                a.multiple = !!d.multiple;
                                f = d.value;
                                null != f ? fb(a, !!d.multiple, f, !1) : null != d.defaultValue && fb(a, !!d.multiple, d.defaultValue, !0);
                                break;
                            default:
                                "function" === typeof e.onClick && (a.onclick = Bf);
                        }
                        switch(c){
                            case "button":
                            case "input":
                            case "select":
                            case "textarea":
                                d = !!d.autoFocus;
                                break a;
                            case "img":
                                d = !0;
                                break a;
                            default:
                                d = !1;
                        }
                    }
                    d && (b.flags |= 4);
                }
                null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
            }
            S(b);
            return null;
        case 6:
            if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
            else {
                if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
                c = xh(wh.current);
                xh(uh.current);
                if (Gg(b)) {
                    d = b.stateNode;
                    c = b.memoizedProps;
                    d[Of] = b;
                    if (f = d.nodeValue !== c) {
                        if (a = xg, null !== a) switch(a.tag){
                            case 3:
                                Af(d.nodeValue, c, 0 !== (a.mode & 1));
                                break;
                            case 5:
                                !0 !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
                        }
                    }
                    f && (b.flags |= 4);
                } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
            }
            S(b);
            return null;
        case 13:
            E(L);
            d = b.memoizedState;
            if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
                if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f = !1;
                else if (f = Gg(b), null !== d && null !== d.dehydrated) {
                    if (null === a) {
                        if (!f) throw Error(p(318));
                        f = b.memoizedState;
                        f = null !== f ? f.dehydrated : null;
                        if (!f) throw Error(p(317));
                        f[Of] = b;
                    } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
                    S(b);
                    f = !1;
                } else null !== zg && (Fj(zg), zg = null), f = !0;
                if (!f) return b.flags & 65536 ? b : null;
            }
            if (0 !== (b.flags & 128)) return b.lanes = c, b;
            d = null !== d;
            d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
            null !== b.updateQueue && (b.flags |= 4);
            S(b);
            return null;
        case 4:
            return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
        case 10:
            return ah(b.type._context), S(b), null;
        case 17:
            return Zf(b.type) && $f(), S(b), null;
        case 19:
            E(L);
            f = b.memoizedState;
            if (null === f) return S(b), null;
            d = 0 !== (b.flags & 128);
            g = f.rendering;
            if (null === g) {
                if (d) Dj(f, !1);
                else {
                    if (0 !== T || null !== a && 0 !== (a.flags & 128)) for(a = b.child; null !== a;){
                        g = Ch(a);
                        if (null !== g) {
                            b.flags |= 128;
                            Dj(f, !1);
                            d = g.updateQueue;
                            null !== d && (b.updateQueue = d, b.flags |= 4);
                            b.subtreeFlags = 0;
                            d = c;
                            for(c = b.child; null !== c;)f = c, a = d, f.flags &= 14680066, g = f.alternate, null === g ? (f.childLanes = 0, f.lanes = a, f.child = null, f.subtreeFlags = 0, f.memoizedProps = null, f.memoizedState = null, f.updateQueue = null, f.dependencies = null, f.stateNode = null) : (f.childLanes = g.childLanes, f.lanes = g.lanes, f.child = g.child, f.subtreeFlags = 0, f.deletions = null, f.memoizedProps = g.memoizedProps, f.memoizedState = g.memoizedState, f.updateQueue = g.updateQueue, f.type = g.type, a = g.dependencies, f.dependencies = null === a ? null : {
                                lanes: a.lanes,
                                firstContext: a.firstContext
                            }), c = c.sibling;
                            G(L, L.current & 1 | 2);
                            return b.child;
                        }
                        a = a.sibling;
                    }
                    null !== f.tail && B() > Gj && (b.flags |= 128, d = !0, Dj(f, !1), b.lanes = 4194304);
                }
            } else {
                if (!d) {
                    if (a = Ch(g), null !== a) {
                        if (b.flags |= 128, d = !0, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f, !0), null === f.tail && "hidden" === f.tailMode && !g.alternate && !I) return S(b), null;
                    } else 2 * B() - f.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = !0, Dj(f, !1), b.lanes = 4194304);
                }
                f.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f.last, null !== c ? c.sibling = g : b.child = g, f.last = g);
            }
            if (null !== f.tail) return b = f.tail, f.rendering = b, f.tail = b.sibling, f.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
            S(b);
            return null;
        case 22:
        case 23:
            return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
        case 24:
            return null;
        case 25:
            return null;
    }
    throw Error(p(156, b.tag));
}
function Ij(a, b) {
    wg(b);
    switch(b.tag){
        case 1:
            return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
        case 3:
            return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
        case 5:
            return Bh(b), null;
        case 13:
            E(L);
            a = b.memoizedState;
            if (null !== a && null !== a.dehydrated) {
                if (null === b.alternate) throw Error(p(340));
                Ig();
            }
            a = b.flags;
            return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
        case 19:
            return E(L), null;
        case 4:
            return zh(), null;
        case 10:
            return ah(b.type._context), null;
        case 22:
        case 23:
            return Hj(), null;
        case 24:
            return null;
        default:
            return null;
    }
}
var Jj = !1, U = !1, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
function Lj(a, b) {
    var c = a.ref;
    if (null !== c) {
        if ("function" === typeof c) try {
            c(null);
        } catch (d) {
            W(a, b, d);
        }
        else c.current = null;
    }
}
function Mj(a, b, c) {
    try {
        c();
    } catch (d) {
        W(a, b, d);
    }
}
var Nj = !1;
function Oj(a, b) {
    Cf = dd;
    a = Me();
    if (Ne(a)) {
        if ("selectionStart" in a) var c = {
            start: a.selectionStart,
            end: a.selectionEnd
        };
        else a: {
            c = (c = a.ownerDocument) && c.defaultView || window;
            var d = c.getSelection && c.getSelection();
            if (d && 0 !== d.rangeCount) {
                c = d.anchorNode;
                var e = d.anchorOffset, f = d.focusNode;
                d = d.focusOffset;
                try {
                    c.nodeType, f.nodeType;
                } catch (F) {
                    c = null;
                    break a;
                }
                var g = 0, h = -1, k = -1, l = 0, m = 0, q = a, r = null;
                b: for(;;){
                    for(var y;;){
                        q !== c || 0 !== e && 3 !== q.nodeType || (h = g + e);
                        q !== f || 0 !== d && 3 !== q.nodeType || (k = g + d);
                        3 === q.nodeType && (g += q.nodeValue.length);
                        if (null === (y = q.firstChild)) break;
                        r = q;
                        q = y;
                    }
                    for(;;){
                        if (q === a) break b;
                        r === c && ++l === e && (h = g);
                        r === f && ++m === d && (k = g);
                        if (null !== (y = q.nextSibling)) break;
                        q = r;
                        r = q.parentNode;
                    }
                    q = y;
                }
                c = -1 === h || -1 === k ? null : {
                    start: h,
                    end: k
                };
            } else c = null;
        }
        c = c || {
            start: 0,
            end: 0
        };
    } else c = null;
    Df = {
        focusedElem: a,
        selectionRange: c
    };
    dd = !1;
    for(V = b; null !== V;)if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
    else for(; null !== V;){
        b = V;
        try {
            var n = b.alternate;
            if (0 !== (b.flags & 1024)) switch(b.tag){
                case 0:
                case 11:
                case 15:
                    break;
                case 1:
                    if (null !== n) {
                        var t = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t : Ci(b.type, t), J);
                        x.__reactInternalSnapshotBeforeUpdate = w;
                    }
                    break;
                case 3:
                    var u = b.stateNode.containerInfo;
                    1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
                    break;
                case 5:
                case 6:
                case 4:
                case 17:
                    break;
                default:
                    throw Error(p(163));
            }
        } catch (F) {
            W(b, b.return, F);
        }
        a = b.sibling;
        if (null !== a) {
            a.return = b.return;
            V = a;
            break;
        }
        V = b.return;
    }
    n = Nj;
    Nj = !1;
    return n;
}
function Pj(a, b, c) {
    var d = b.updateQueue;
    d = null !== d ? d.lastEffect : null;
    if (null !== d) {
        var e = d = d.next;
        do {
            if ((e.tag & a) === a) {
                var f = e.destroy;
                e.destroy = void 0;
                void 0 !== f && Mj(b, c, f);
            }
            e = e.next;
        }while (e !== d)
    }
}
function Qj(a, b) {
    b = b.updateQueue;
    b = null !== b ? b.lastEffect : null;
    if (null !== b) {
        var c = b = b.next;
        do {
            if ((c.tag & a) === a) {
                var d = c.create;
                c.destroy = d();
            }
            c = c.next;
        }while (c !== b)
    }
}
function Rj(a) {
    var b = a.ref;
    if (null !== b) {
        var c = a.stateNode;
        switch(a.tag){
            case 5:
                a = c;
                break;
            default:
                a = c;
        }
        "function" === typeof b ? b(a) : b.current = a;
    }
}
function Sj(a) {
    var b = a.alternate;
    null !== b && (a.alternate = null, Sj(b));
    a.child = null;
    a.deletions = null;
    a.sibling = null;
    5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
    a.stateNode = null;
    a.return = null;
    a.dependencies = null;
    a.memoizedProps = null;
    a.memoizedState = null;
    a.pendingProps = null;
    a.stateNode = null;
    a.updateQueue = null;
}
function Tj(a) {
    return 5 === a.tag || 3 === a.tag || 4 === a.tag;
}
function Uj(a) {
    a: for(;;){
        for(; null === a.sibling;){
            if (null === a.return || Tj(a.return)) return null;
            a = a.return;
        }
        a.sibling.return = a.return;
        for(a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag;){
            if (a.flags & 2) continue a;
            if (null === a.child || 4 === a.tag) continue a;
            else a.child.return = a, a = a.child;
        }
        if (!(a.flags & 2)) return a.stateNode;
    }
}
function Vj(a, b, c) {
    var d = a.tag;
    if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
    else if (4 !== d && (a = a.child, null !== a)) for(Vj(a, b, c), a = a.sibling; null !== a;)Vj(a, b, c), a = a.sibling;
}
function Wj(a, b, c) {
    var d = a.tag;
    if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
    else if (4 !== d && (a = a.child, null !== a)) for(Wj(a, b, c), a = a.sibling; null !== a;)Wj(a, b, c), a = a.sibling;
}
var X = null, Xj = !1;
function Yj(a, b, c) {
    for(c = c.child; null !== c;)Zj(a, b, c), c = c.sibling;
}
function Zj(a, b, c) {
    if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
        lc.onCommitFiberUnmount(kc, c);
    } catch (h) {}
    switch(c.tag){
        case 5:
            U || Lj(c, b);
        case 6:
            var d = X, e = Xj;
            X = null;
            Yj(a, b, c);
            X = d;
            Xj = e;
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
            break;
        case 18:
            null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
            break;
        case 4:
            d = X;
            e = Xj;
            X = c.stateNode.containerInfo;
            Xj = !0;
            Yj(a, b, c);
            X = d;
            Xj = e;
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
                e = d = d.next;
                do {
                    var f = e, g = f.destroy;
                    f = f.tag;
                    void 0 !== g && (0 !== (f & 2) ? Mj(c, b, g) : 0 !== (f & 4) && Mj(c, b, g));
                    e = e.next;
                }while (e !== d)
            }
            Yj(a, b, c);
            break;
        case 1:
            if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
                d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
            } catch (h) {
                W(c, b, h);
            }
            Yj(a, b, c);
            break;
        case 21:
            Yj(a, b, c);
            break;
        case 22:
            c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
            break;
        default:
            Yj(a, b, c);
    }
}
function ak(a) {
    var b = a.updateQueue;
    if (null !== b) {
        a.updateQueue = null;
        var c = a.stateNode;
        null === c && (c = a.stateNode = new Kj);
        b.forEach(function(b) {
            var d = bk.bind(null, a, b);
            c.has(b) || (c.add(b), b.then(d, d));
        });
    }
}
function ck(a, b) {
    var c = b.deletions;
    if (null !== c) for(var d = 0; d < c.length; d++){
        var e = c[d];
        try {
            var f = a, g = b, h = g;
            a: for(; null !== h;){
                switch(h.tag){
                    case 5:
                        X = h.stateNode;
                        Xj = !1;
                        break a;
                    case 3:
                        X = h.stateNode.containerInfo;
                        Xj = !0;
                        break a;
                    case 4:
                        X = h.stateNode.containerInfo;
                        Xj = !0;
                        break a;
                }
                h = h.return;
            }
            if (null === X) throw Error(p(160));
            Zj(f, g, e);
            X = null;
            Xj = !1;
            var k = e.alternate;
            null !== k && (k.return = null);
            e.return = null;
        } catch (l) {
            W(e, b, l);
        }
    }
    if (b.subtreeFlags & 12854) for(b = b.child; null !== b;)dk(b, a), b = b.sibling;
}
function dk(a, b) {
    var c = a.alternate, d = a.flags;
    switch(a.tag){
        case 0:
        case 11:
        case 14:
        case 15:
            ck(b, a);
            ek(a);
            if (d & 4) {
                try {
                    Pj(3, a, a.return), Qj(3, a);
                } catch (t) {
                    W(a, a.return, t);
                }
                try {
                    Pj(5, a, a.return);
                } catch (t) {
                    W(a, a.return, t);
                }
            }
            break;
        case 1:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            break;
        case 5:
            ck(b, a);
            ek(a);
            d & 512 && null !== c && Lj(c, c.return);
            if (a.flags & 32) {
                var e = a.stateNode;
                try {
                    ob(e, "");
                } catch (t) {
                    W(a, a.return, t);
                }
            }
            if (d & 4 && (e = a.stateNode, null != e)) {
                var f = a.memoizedProps, g = null !== c ? c.memoizedProps : f, h = a.type, k = a.updateQueue;
                a.updateQueue = null;
                if (null !== k) try {
                    "input" === h && "radio" === f.type && null != f.name && ab(e, f);
                    vb(h, g);
                    var l = vb(h, f);
                    for(g = 0; g < k.length; g += 2){
                        var m = k[g], q = k[g + 1];
                        "style" === m ? sb(e, q) : "dangerouslySetInnerHTML" === m ? nb(e, q) : "children" === m ? ob(e, q) : ta(e, m, q, l);
                    }
                    switch(h){
                        case "input":
                            bb(e, f);
                            break;
                        case "textarea":
                            ib(e, f);
                            break;
                        case "select":
                            var r = e._wrapperState.wasMultiple;
                            e._wrapperState.wasMultiple = !!f.multiple;
                            var y = f.value;
                            null != y ? fb(e, !!f.multiple, y, !1) : r !== !!f.multiple && (null != f.defaultValue ? fb(e, !!f.multiple, f.defaultValue, !0) : fb(e, !!f.multiple, f.multiple ? [] : "", !1));
                    }
                    e[Pf] = f;
                } catch (t) {
                    W(a, a.return, t);
                }
            }
            break;
        case 6:
            ck(b, a);
            ek(a);
            if (d & 4) {
                if (null === a.stateNode) throw Error(p(162));
                e = a.stateNode;
                f = a.memoizedProps;
                try {
                    e.nodeValue = f;
                } catch (t) {
                    W(a, a.return, t);
                }
            }
            break;
        case 3:
            ck(b, a);
            ek(a);
            if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
                bd(b.containerInfo);
            } catch (t) {
                W(a, a.return, t);
            }
            break;
        case 4:
            ck(b, a);
            ek(a);
            break;
        case 13:
            ck(b, a);
            ek(a);
            e = a.child;
            e.flags & 8192 && (f = null !== e.memoizedState, e.stateNode.isHidden = f, !f || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
            d & 4 && ak(a);
            break;
        case 22:
            m = null !== c && null !== c.memoizedState;
            a.mode & 1 ? (U = (l = U) || m, ck(b, a), U = l) : ck(b, a);
            ek(a);
            if (d & 8192) {
                l = null !== a.memoizedState;
                if ((a.stateNode.isHidden = l) && !m && 0 !== (a.mode & 1)) for(V = a, m = a.child; null !== m;){
                    for(q = V = m; null !== V;){
                        r = V;
                        y = r.child;
                        switch(r.tag){
                            case 0:
                            case 11:
                            case 14:
                            case 15:
                                Pj(4, r, r.return);
                                break;
                            case 1:
                                Lj(r, r.return);
                                var n = r.stateNode;
                                if ("function" === typeof n.componentWillUnmount) {
                                    d = r;
                                    c = r.return;
                                    try {
                                        b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                                    } catch (t) {
                                        W(d, c, t);
                                    }
                                }
                                break;
                            case 5:
                                Lj(r, r.return);
                                break;
                            case 22:
                                if (null !== r.memoizedState) {
                                    gk(q);
                                    continue;
                                }
                        }
                        null !== y ? (y.return = r, V = y) : gk(q);
                    }
                    m = m.sibling;
                }
                a: for(m = null, q = a;;){
                    if (5 === q.tag) {
                        if (null === m) {
                            m = q;
                            try {
                                e = q.stateNode, l ? (f = e.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                            } catch (t) {
                                W(a, a.return, t);
                            }
                        }
                    } else if (6 === q.tag) {
                        if (null === m) try {
                            q.stateNode.nodeValue = l ? "" : q.memoizedProps;
                        } catch (t) {
                            W(a, a.return, t);
                        }
                    } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a) && null !== q.child) {
                        q.child.return = q;
                        q = q.child;
                        continue;
                    }
                    if (q === a) break a;
                    for(; null === q.sibling;){
                        if (null === q.return || q.return === a) break a;
                        m === q && (m = null);
                        q = q.return;
                    }
                    m === q && (m = null);
                    q.sibling.return = q.return;
                    q = q.sibling;
                }
            }
            break;
        case 19:
            ck(b, a);
            ek(a);
            d & 4 && ak(a);
            break;
        case 21:
            break;
        default:
            ck(b, a), ek(a);
    }
}
function ek(a) {
    var b = a.flags;
    if (b & 2) {
        try {
            a: {
                for(var c = a.return; null !== c;){
                    if (Tj(c)) {
                        var d = c;
                        break a;
                    }
                    c = c.return;
                }
                throw Error(p(160));
            }
            switch(d.tag){
                case 5:
                    var e = d.stateNode;
                    d.flags & 32 && (ob(e, ""), d.flags &= -33);
                    var f = Uj(a);
                    Wj(a, f, e);
                    break;
                case 3:
                case 4:
                    var g = d.stateNode.containerInfo, h = Uj(a);
                    Vj(a, h, g);
                    break;
                default:
                    throw Error(p(161));
            }
        } catch (k) {
            W(a, a.return, k);
        }
        a.flags &= -3;
    }
    b & 4096 && (a.flags &= -4097);
}
function hk(a, b, c) {
    V = a;
    ik(a, b, c);
}
function ik(a, b, c) {
    for(var d = 0 !== (a.mode & 1); null !== V;){
        var e = V, f = e.child;
        if (22 === e.tag && d) {
            var g = null !== e.memoizedState || Jj;
            if (!g) {
                var h = e.alternate, k = null !== h && null !== h.memoizedState || U;
                h = Jj;
                var l = U;
                Jj = g;
                if ((U = k) && !l) for(V = e; null !== V;)g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k ? (k.return = g, V = k) : jk(e);
                for(; null !== f;)V = f, ik(f, b, c), f = f.sibling;
                V = e;
                Jj = h;
                U = l;
            }
            kk(a, b, c);
        } else 0 !== (e.subtreeFlags & 8772) && null !== f ? (f.return = e, V = f) : kk(a, b, c);
    }
}
function kk(a) {
    for(; null !== V;){
        var b = V;
        if (0 !== (b.flags & 8772)) {
            var c = b.alternate;
            try {
                if (0 !== (b.flags & 8772)) switch(b.tag){
                    case 0:
                    case 11:
                    case 15:
                        U || Qj(5, b);
                        break;
                    case 1:
                        var d = b.stateNode;
                        if (b.flags & 4 && !U) {
                            if (null === c) d.componentDidMount();
                            else {
                                var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                                d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
                            }
                        }
                        var f = b.updateQueue;
                        null !== f && sh(b, f, d);
                        break;
                    case 3:
                        var g = b.updateQueue;
                        if (null !== g) {
                            c = null;
                            if (null !== b.child) switch(b.child.tag){
                                case 5:
                                    c = b.child.stateNode;
                                    break;
                                case 1:
                                    c = b.child.stateNode;
                            }
                            sh(b, g, c);
                        }
                        break;
                    case 5:
                        var h = b.stateNode;
                        if (null === c && b.flags & 4) {
                            c = h;
                            var k = b.memoizedProps;
                            switch(b.type){
                                case "button":
                                case "input":
                                case "select":
                                case "textarea":
                                    k.autoFocus && c.focus();
                                    break;
                                case "img":
                                    k.src && (c.src = k.src);
                            }
                        }
                        break;
                    case 6:
                        break;
                    case 4:
                        break;
                    case 12:
                        break;
                    case 13:
                        if (null === b.memoizedState) {
                            var l = b.alternate;
                            if (null !== l) {
                                var m = l.memoizedState;
                                if (null !== m) {
                                    var q = m.dehydrated;
                                    null !== q && bd(q);
                                }
                            }
                        }
                        break;
                    case 19:
                    case 17:
                    case 21:
                    case 22:
                    case 23:
                    case 25:
                        break;
                    default:
                        throw Error(p(163));
                }
                U || b.flags & 512 && Rj(b);
            } catch (r) {
                W(b, b.return, r);
            }
        }
        if (b === a) {
            V = null;
            break;
        }
        c = b.sibling;
        if (null !== c) {
            c.return = b.return;
            V = c;
            break;
        }
        V = b.return;
    }
}
function gk(a) {
    for(; null !== V;){
        var b = V;
        if (b === a) {
            V = null;
            break;
        }
        var c = b.sibling;
        if (null !== c) {
            c.return = b.return;
            V = c;
            break;
        }
        V = b.return;
    }
}
function jk(a) {
    for(; null !== V;){
        var b = V;
        try {
            switch(b.tag){
                case 0:
                case 11:
                case 15:
                    var c = b.return;
                    try {
                        Qj(4, b);
                    } catch (k) {
                        W(b, c, k);
                    }
                    break;
                case 1:
                    var d = b.stateNode;
                    if ("function" === typeof d.componentDidMount) {
                        var e = b.return;
                        try {
                            d.componentDidMount();
                        } catch (k) {
                            W(b, e, k);
                        }
                    }
                    var f = b.return;
                    try {
                        Rj(b);
                    } catch (k) {
                        W(b, f, k);
                    }
                    break;
                case 5:
                    var g = b.return;
                    try {
                        Rj(b);
                    } catch (k) {
                        W(b, g, k);
                    }
            }
        } catch (k) {
            W(b, b.return, k);
        }
        if (b === a) {
            V = null;
            break;
        }
        var h = b.sibling;
        if (null !== h) {
            h.return = b.return;
            V = h;
            break;
        }
        V = b.return;
    }
}
var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = !1, Pi = null, Ri = null, vk = !1, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
function R() {
    return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
}
function yi(a) {
    if (0 === (a.mode & 1)) return 1;
    if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
    if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
    a = C;
    if (0 !== a) return a;
    a = window.event;
    a = void 0 === a ? 16 : jd(a.type);
    return a;
}
function gi(a, b, c, d) {
    if (50 < yk) throw yk = 0, zk = null, Error(p(185));
    Ac(a, c, d);
    if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
}
function Dk(a, b) {
    var c = a.callbackNode;
    wc(a, b);
    var d = uc(a, a === Q ? Z : 0);
    if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
    else if (b = d & -d, a.callbackPriority !== b) {
        null != c && bc(c);
        if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
            0 === (K & 6) && jg();
        }), c = null;
        else {
            switch(Dc(d)){
                case 1:
                    c = fc;
                    break;
                case 4:
                    c = gc;
                    break;
                case 16:
                    c = hc;
                    break;
                case 536870912:
                    c = jc;
                    break;
                default:
                    c = hc;
            }
            c = Fk(c, Gk.bind(null, a));
        }
        a.callbackPriority = b;
        a.callbackNode = c;
    }
}
function Gk(a, b) {
    Ak = -1;
    Bk = 0;
    if (0 !== (K & 6)) throw Error(p(327));
    var c = a.callbackNode;
    if (Hk() && a.callbackNode !== c) return null;
    var d = uc(a, a === Q ? Z : 0);
    if (0 === d) return null;
    if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
    else {
        b = d;
        var e = K;
        K |= 2;
        var f = Jk();
        if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
        for(;;)try {
            Lk();
            break;
        } catch (h) {
            Mk(a, h);
        }
        $g();
        mk.current = f;
        K = e;
        null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
    }
    if (0 !== b) {
        2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
        if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
        if (6 === b) Ck(a, d);
        else {
            e = a.current.alternate;
            if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f = xc(a), 0 !== f && (d = f, b = Nk(a, f))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
            a.finishedWork = e;
            a.finishedLanes = d;
            switch(b){
                case 0:
                case 1:
                    throw Error(p(345));
                case 2:
                    Pk(a, tk, uk);
                    break;
                case 3:
                    Ck(a, d);
                    if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
                        if (0 !== uc(a, 0)) break;
                        e = a.suspendedLanes;
                        if ((e & d) !== d) {
                            R();
                            a.pingedLanes |= a.suspendedLanes & e;
                            break;
                        }
                        a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
                        break;
                    }
                    Pk(a, tk, uk);
                    break;
                case 4:
                    Ck(a, d);
                    if ((d & 4194240) === d) break;
                    b = a.eventTimes;
                    for(e = -1; 0 < d;){
                        var g = 31 - oc(d);
                        f = 1 << g;
                        g = b[g];
                        g > e && (e = g);
                        d &= ~f;
                    }
                    d = e;
                    d = B() - d;
                    d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3E3 > d ? 3E3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
                    if (10 < d) {
                        a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
                        break;
                    }
                    Pk(a, tk, uk);
                    break;
                case 5:
                    Pk(a, tk, uk);
                    break;
                default:
                    throw Error(p(329));
            }
        }
    }
    Dk(a, B());
    return a.callbackNode === c ? Gk.bind(null, a) : null;
}
function Nk(a, b) {
    var c = sk;
    a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
    a = Ik(a, b);
    2 !== a && (b = tk, tk = c, null !== b && Fj(b));
    return a;
}
function Fj(a) {
    null === tk ? tk = a : tk.push.apply(tk, a);
}
function Ok(a) {
    for(var b = a;;){
        if (b.flags & 16384) {
            var c = b.updateQueue;
            if (null !== c && (c = c.stores, null !== c)) for(var d = 0; d < c.length; d++){
                var e = c[d], f = e.getSnapshot;
                e = e.value;
                try {
                    if (!He(f(), e)) return !1;
                } catch (g) {
                    return !1;
                }
            }
        }
        c = b.child;
        if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
        else {
            if (b === a) break;
            for(; null === b.sibling;){
                if (null === b.return || b.return === a) return !0;
                b = b.return;
            }
            b.sibling.return = b.return;
            b = b.sibling;
        }
    }
    return !0;
}
function Ck(a, b) {
    b &= ~rk;
    b &= ~qk;
    a.suspendedLanes |= b;
    a.pingedLanes &= ~b;
    for(a = a.expirationTimes; 0 < b;){
        var c = 31 - oc(b), d = 1 << c;
        a[c] = -1;
        b &= ~d;
    }
}
function Ek(a) {
    if (0 !== (K & 6)) throw Error(p(327));
    Hk();
    var b = uc(a, 0);
    if (0 === (b & 1)) return Dk(a, B()), null;
    var c = Ik(a, b);
    if (0 !== a.tag && 2 === c) {
        var d = xc(a);
        0 !== d && (b = d, c = Nk(a, d));
    }
    if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
    if (6 === c) throw Error(p(345));
    a.finishedWork = a.current.alternate;
    a.finishedLanes = b;
    Pk(a, tk, uk);
    Dk(a, B());
    return null;
}
function Qk(a, b) {
    var c = K;
    K |= 1;
    try {
        return a(b);
    } finally{
        K = c, 0 === K && (Gj = B() + 500, fg && jg());
    }
}
function Rk(a) {
    null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
    var b = K;
    K |= 1;
    var c = ok.transition, d = C;
    try {
        if (ok.transition = null, C = 1, a) return a();
    } finally{
        C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
    }
}
function Hj() {
    fj = ej.current;
    E(ej);
}
function Kk(a, b) {
    a.finishedWork = null;
    a.finishedLanes = 0;
    var c = a.timeoutHandle;
    -1 !== c && (a.timeoutHandle = -1, Gf(c));
    if (null !== Y) for(c = Y.return; null !== c;){
        var d = c;
        wg(d);
        switch(d.tag){
            case 1:
                d = d.type.childContextTypes;
                null !== d && void 0 !== d && $f();
                break;
            case 3:
                zh();
                E(Wf);
                E(H);
                Eh();
                break;
            case 5:
                Bh(d);
                break;
            case 4:
                zh();
                break;
            case 13:
                E(L);
                break;
            case 19:
                E(L);
                break;
            case 10:
                ah(d.type._context);
                break;
            case 22:
            case 23:
                Hj();
        }
        c = c.return;
    }
    Q = a;
    Y = a = Pg(a.current, null);
    Z = fj = b;
    T = 0;
    pk = null;
    rk = qk = rh = 0;
    tk = sk = null;
    if (null !== fh) {
        for(b = 0; b < fh.length; b++)if (c = fh[b], d = c.interleaved, null !== d) {
            c.interleaved = null;
            var e = d.next, f = c.pending;
            if (null !== f) {
                var g = f.next;
                f.next = e;
                d.next = g;
            }
            c.pending = d;
        }
        fh = null;
    }
    return a;
}
function Mk(a, b) {
    do {
        var c = Y;
        try {
            $g();
            Fh.current = Rh;
            if (Ih) {
                for(var d = M.memoizedState; null !== d;){
                    var e = d.queue;
                    null !== e && (e.pending = null);
                    d = d.next;
                }
                Ih = !1;
            }
            Hh = 0;
            O = N = M = null;
            Jh = !1;
            Kh = 0;
            nk.current = null;
            if (null === c || null === c.return) {
                T = 1;
                pk = b;
                Y = null;
                break;
            }
            a: {
                var f = a, g = c.return, h = c, k = b;
                b = Z;
                h.flags |= 32768;
                if (null !== k && "object" === typeof k && "function" === typeof k.then) {
                    var l = k, m = h, q = m.tag;
                    if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
                        var r = m.alternate;
                        r ? (m.updateQueue = r.updateQueue, m.memoizedState = r.memoizedState, m.lanes = r.lanes) : (m.updateQueue = null, m.memoizedState = null);
                    }
                    var y = Ui(g);
                    if (null !== y) {
                        y.flags &= -257;
                        Vi(y, g, h, f, b);
                        y.mode & 1 && Si(f, l, b);
                        b = y;
                        k = l;
                        var n = b.updateQueue;
                        if (null === n) {
                            var t = new Set;
                            t.add(k);
                            b.updateQueue = t;
                        } else n.add(k);
                        break a;
                    } else {
                        if (0 === (b & 1)) {
                            Si(f, l, b);
                            tj();
                            break a;
                        }
                        k = Error(p(426));
                    }
                } else if (I && h.mode & 1) {
                    var J = Ui(g);
                    if (null !== J) {
                        0 === (J.flags & 65536) && (J.flags |= 256);
                        Vi(J, g, h, f, b);
                        Jg(Ji(k, h));
                        break a;
                    }
                }
                f = k = Ji(k, h);
                4 !== T && (T = 2);
                null === sk ? sk = [
                    f
                ] : sk.push(f);
                f = g;
                do {
                    switch(f.tag){
                        case 3:
                            f.flags |= 65536;
                            b &= -b;
                            f.lanes |= b;
                            var x = Ni(f, k, b);
                            ph(f, x);
                            break a;
                        case 1:
                            h = k;
                            var w = f.type, u = f.stateNode;
                            if (0 === (f.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                                f.flags |= 65536;
                                b &= -b;
                                f.lanes |= b;
                                var F = Qi(f, h, b);
                                ph(f, F);
                                break a;
                            }
                    }
                    f = f.return;
                }while (null !== f)
            }
            Sk(c);
        } catch (na) {
            b = na;
            Y === c && null !== c && (Y = c = c.return);
            continue;
        }
        break;
    }while (1)
}
function Jk() {
    var a = mk.current;
    mk.current = Rh;
    return null === a ? Rh : a;
}
function tj() {
    if (0 === T || 3 === T || 2 === T) T = 4;
    null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
}
function Ik(a, b) {
    var c = K;
    K |= 2;
    var d = Jk();
    if (Q !== a || Z !== b) uk = null, Kk(a, b);
    for(;;)try {
        Tk();
        break;
    } catch (e) {
        Mk(a, e);
    }
    $g();
    K = c;
    mk.current = d;
    if (null !== Y) throw Error(p(261));
    Q = null;
    Z = 0;
    return T;
}
function Tk() {
    for(; null !== Y;)Uk(Y);
}
function Lk() {
    for(; null !== Y && !cc();)Uk(Y);
}
function Uk(a) {
    var b = Vk(a.alternate, a, fj);
    a.memoizedProps = a.pendingProps;
    null === b ? Sk(a) : Y = b;
    nk.current = null;
}
function Sk(a) {
    var b = a;
    do {
        var c = b.alternate;
        a = b.return;
        if (0 === (b.flags & 32768)) {
            if (c = Ej(c, b, fj), null !== c) {
                Y = c;
                return;
            }
        } else {
            c = Ij(c, b);
            if (null !== c) {
                c.flags &= 32767;
                Y = c;
                return;
            }
            if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
            else {
                T = 6;
                Y = null;
                return;
            }
        }
        b = b.sibling;
        if (null !== b) {
            Y = b;
            return;
        }
        Y = b = a;
    }while (null !== b)
    0 === T && (T = 5);
}
function Pk(a, b, c) {
    var d = C, e = ok.transition;
    try {
        ok.transition = null, C = 1, Wk(a, b, c, d);
    } finally{
        ok.transition = e, C = d;
    }
    return null;
}
function Wk(a, b, c, d) {
    do Hk();
    while (null !== wk)
    if (0 !== (K & 6)) throw Error(p(327));
    c = a.finishedWork;
    var e = a.finishedLanes;
    if (null === c) return null;
    a.finishedWork = null;
    a.finishedLanes = 0;
    if (c === a.current) throw Error(p(177));
    a.callbackNode = null;
    a.callbackPriority = 0;
    var f = c.lanes | c.childLanes;
    Bc(a, f);
    a === Q && (Y = Q = null, Z = 0);
    0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = !0, Fk(hc, function() {
        Hk();
        return null;
    }));
    f = 0 !== (c.flags & 15990);
    if (0 !== (c.subtreeFlags & 15990) || f) {
        f = ok.transition;
        ok.transition = null;
        var g = C;
        C = 1;
        var h = K;
        K |= 4;
        nk.current = null;
        Oj(a, c);
        dk(c, a);
        Oe(Df);
        dd = !!Cf;
        Df = Cf = null;
        a.current = c;
        hk(c, a, e);
        dc();
        K = h;
        C = g;
        ok.transition = f;
    } else a.current = c;
    vk && (vk = !1, wk = a, xk = e);
    f = a.pendingLanes;
    0 === f && (Ri = null);
    mc(c.stateNode, d);
    Dk(a, B());
    if (null !== b) for(d = a.onRecoverableError, c = 0; c < b.length; c++)e = b[c], d(e.value, {
        componentStack: e.stack,
        digest: e.digest
    });
    if (Oi) throw Oi = !1, a = Pi, Pi = null, a;
    0 !== (xk & 1) && 0 !== a.tag && Hk();
    f = a.pendingLanes;
    0 !== (f & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
    jg();
    return null;
}
function Hk() {
    if (null !== wk) {
        var a = Dc(xk), b = ok.transition, c = C;
        try {
            ok.transition = null;
            C = 16 > a ? 16 : a;
            if (null === wk) var d = !1;
            else {
                a = wk;
                wk = null;
                xk = 0;
                if (0 !== (K & 6)) throw Error(p(331));
                var e = K;
                K |= 4;
                for(V = a.current; null !== V;){
                    var f = V, g = f.child;
                    if (0 !== (V.flags & 16)) {
                        var h = f.deletions;
                        if (null !== h) {
                            for(var k = 0; k < h.length; k++){
                                var l = h[k];
                                for(V = l; null !== V;){
                                    var m = V;
                                    switch(m.tag){
                                        case 0:
                                        case 11:
                                        case 15:
                                            Pj(8, m, f);
                                    }
                                    var q = m.child;
                                    if (null !== q) q.return = m, V = q;
                                    else for(; null !== V;){
                                        m = V;
                                        var r = m.sibling, y = m.return;
                                        Sj(m);
                                        if (m === l) {
                                            V = null;
                                            break;
                                        }
                                        if (null !== r) {
                                            r.return = y;
                                            V = r;
                                            break;
                                        }
                                        V = y;
                                    }
                                }
                            }
                            var n = f.alternate;
                            if (null !== n) {
                                var t = n.child;
                                if (null !== t) {
                                    n.child = null;
                                    do {
                                        var J = t.sibling;
                                        t.sibling = null;
                                        t = J;
                                    }while (null !== t)
                                }
                            }
                            V = f;
                        }
                    }
                    if (0 !== (f.subtreeFlags & 2064) && null !== g) g.return = f, V = g;
                    else b: for(; null !== V;){
                        f = V;
                        if (0 !== (f.flags & 2048)) switch(f.tag){
                            case 0:
                            case 11:
                            case 15:
                                Pj(9, f, f.return);
                        }
                        var x = f.sibling;
                        if (null !== x) {
                            x.return = f.return;
                            V = x;
                            break b;
                        }
                        V = f.return;
                    }
                }
                var w = a.current;
                for(V = w; null !== V;){
                    g = V;
                    var u = g.child;
                    if (0 !== (g.subtreeFlags & 2064) && null !== u) u.return = g, V = u;
                    else b: for(g = w; null !== V;){
                        h = V;
                        if (0 !== (h.flags & 2048)) try {
                            switch(h.tag){
                                case 0:
                                case 11:
                                case 15:
                                    Qj(9, h);
                            }
                        } catch (na) {
                            W(h, h.return, na);
                        }
                        if (h === g) {
                            V = null;
                            break b;
                        }
                        var F = h.sibling;
                        if (null !== F) {
                            F.return = h.return;
                            V = F;
                            break b;
                        }
                        V = h.return;
                    }
                }
                K = e;
                jg();
                if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
                    lc.onPostCommitFiberRoot(kc, a);
                } catch (na) {}
                d = !0;
            }
            return d;
        } finally{
            C = c, ok.transition = b;
        }
    }
    return !1;
}
function Xk(a, b, c) {
    b = Ji(c, b);
    b = Ni(a, b, 1);
    a = nh(a, b, 1);
    b = R();
    null !== a && (Ac(a, 1, b), Dk(a, b));
}
function W(a, b, c) {
    if (3 === a.tag) Xk(a, a, c);
    else for(; null !== b;){
        if (3 === b.tag) {
            Xk(b, a, c);
            break;
        } else if (1 === b.tag) {
            var d = b.stateNode;
            if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
                a = Ji(c, a);
                a = Qi(b, a, 1);
                b = nh(b, a, 1);
                a = R();
                null !== b && (Ac(b, 1, a), Dk(b, a));
                break;
            }
        }
        b = b.return;
    }
}
function Ti(a, b, c) {
    var d = a.pingCache;
    null !== d && d.delete(b);
    b = R();
    a.pingedLanes |= a.suspendedLanes & c;
    Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
    Dk(a, b);
}
function Yk(a, b) {
    0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
    var c = R();
    a = ih(a, b);
    null !== a && (Ac(a, b, c), Dk(a, c));
}
function uj(a) {
    var b = a.memoizedState, c = 0;
    null !== b && (c = b.retryLane);
    Yk(a, c);
}
function bk(a, b) {
    var c = 0;
    switch(a.tag){
        case 13:
            var d = a.stateNode;
            var e = a.memoizedState;
            null !== e && (c = e.retryLane);
            break;
        case 19:
            d = a.stateNode;
            break;
        default:
            throw Error(p(314));
    }
    null !== d && d.delete(b);
    Yk(a, c);
}
var Vk;
Vk = function(a, b, c) {
    if (null !== a) {
        if (a.memoizedProps !== b.pendingProps || Wf.current) dh = !0;
        else {
            if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = !1, yj(a, b, c);
            dh = 0 !== (a.flags & 131072) ? !0 : !1;
        }
    } else dh = !1, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
    b.lanes = 0;
    switch(b.tag){
        case 2:
            var d = b.type;
            ij(a, b);
            a = b.pendingProps;
            var e = Yf(b, H.current);
            ch(b, c);
            e = Nh(null, b, d, a, e, c);
            var f = Sh();
            b.flags |= 1;
            "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f = !0, cg(b)) : f = !1, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, !0, f, c)) : (b.tag = 0, I && f && vg(b), Xi(null, b, e, c), b = b.child);
            return b;
        case 16:
            d = b.elementType;
            a: {
                ij(a, b);
                a = b.pendingProps;
                e = d._init;
                d = e(d._payload);
                b.type = d;
                e = b.tag = Zk(d);
                a = Ci(d, a);
                switch(e){
                    case 0:
                        b = cj(null, b, d, a, c);
                        break a;
                    case 1:
                        b = hj(null, b, d, a, c);
                        break a;
                    case 11:
                        b = Yi(null, b, d, a, c);
                        break a;
                    case 14:
                        b = $i(null, b, d, Ci(d.type, a), c);
                        break a;
                }
                throw Error(p(306, d, ""));
            }
            return b;
        case 0:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
        case 1:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
        case 3:
            a: {
                kj(b);
                if (null === a) throw Error(p(387));
                d = b.pendingProps;
                f = b.memoizedState;
                e = f.element;
                lh(a, b);
                qh(b, d, null, c);
                var g = b.memoizedState;
                d = g.element;
                if (f.isDehydrated) {
                    if (f = {
                        element: d,
                        isDehydrated: !1,
                        cache: g.cache,
                        pendingSuspenseBoundaries: g.pendingSuspenseBoundaries,
                        transitions: g.transitions
                    }, b.updateQueue.baseState = f, b.memoizedState = f, b.flags & 256) {
                        e = Ji(Error(p(423)), b);
                        b = lj(a, b, d, c, e);
                        break a;
                    } else if (d !== e) {
                        e = Ji(Error(p(424)), b);
                        b = lj(a, b, d, c, e);
                        break a;
                    } else for(yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = !0, zg = null, c = Vg(b, null, d, c), b.child = c; c;)c.flags = c.flags & -3 | 4096, c = c.sibling;
                } else {
                    Ig();
                    if (d === e) {
                        b = Zi(a, b, c);
                        break a;
                    }
                    Xi(a, b, d, c);
                }
                b = b.child;
            }
            return b;
        case 5:
            return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f && Ef(d, f) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
        case 6:
            return null === a && Eg(b), null;
        case 13:
            return oj(a, b, c);
        case 4:
            return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
        case 11:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
        case 7:
            return Xi(a, b, b.pendingProps, c), b.child;
        case 8:
            return Xi(a, b, b.pendingProps.children, c), b.child;
        case 12:
            return Xi(a, b, b.pendingProps.children, c), b.child;
        case 10:
            a: {
                d = b.type._context;
                e = b.pendingProps;
                f = b.memoizedProps;
                g = e.value;
                G(Wg, d._currentValue);
                d._currentValue = g;
                if (null !== f) {
                    if (He(f.value, g)) {
                        if (f.children === e.children && !Wf.current) {
                            b = Zi(a, b, c);
                            break a;
                        }
                    } else for(f = b.child, null !== f && (f.return = b); null !== f;){
                        var h = f.dependencies;
                        if (null !== h) {
                            g = f.child;
                            for(var k = h.firstContext; null !== k;){
                                if (k.context === d) {
                                    if (1 === f.tag) {
                                        k = mh(-1, c & -c);
                                        k.tag = 2;
                                        var l = f.updateQueue;
                                        if (null !== l) {
                                            l = l.shared;
                                            var m = l.pending;
                                            null === m ? k.next = k : (k.next = m.next, m.next = k);
                                            l.pending = k;
                                        }
                                    }
                                    f.lanes |= c;
                                    k = f.alternate;
                                    null !== k && (k.lanes |= c);
                                    bh(f.return, c, b);
                                    h.lanes |= c;
                                    break;
                                }
                                k = k.next;
                            }
                        } else if (10 === f.tag) g = f.type === b.type ? null : f.child;
                        else if (18 === f.tag) {
                            g = f.return;
                            if (null === g) throw Error(p(341));
                            g.lanes |= c;
                            h = g.alternate;
                            null !== h && (h.lanes |= c);
                            bh(g, c, b);
                            g = f.sibling;
                        } else g = f.child;
                        if (null !== g) g.return = f;
                        else for(g = f; null !== g;){
                            if (g === b) {
                                g = null;
                                break;
                            }
                            f = g.sibling;
                            if (null !== f) {
                                f.return = g.return;
                                g = f;
                                break;
                            }
                            g = g.return;
                        }
                        f = g;
                    }
                }
                Xi(a, b, e.children, c);
                b = b.child;
            }
            return b;
        case 9:
            return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
        case 14:
            return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
        case 15:
            return bj(a, b, b.type, b.pendingProps, c);
        case 17:
            return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = !0, cg(b)) : a = !1, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, !0, a, c);
        case 19:
            return xj(a, b, c);
        case 22:
            return dj(a, b, c);
    }
    throw Error(p(156, b.tag));
};
function Fk(a, b) {
    return ac(a, b);
}
function $k(a, b, c, d) {
    this.tag = a;
    this.key = c;
    this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
    this.index = 0;
    this.ref = null;
    this.pendingProps = b;
    this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
    this.mode = d;
    this.subtreeFlags = this.flags = 0;
    this.deletions = null;
    this.childLanes = this.lanes = 0;
    this.alternate = null;
}
function Bg(a, b, c, d) {
    return new $k(a, b, c, d);
}
function aj(a) {
    a = a.prototype;
    return !(!a || !a.isReactComponent);
}
function Zk(a) {
    if ("function" === typeof a) return aj(a) ? 1 : 0;
    if (void 0 !== a && null !== a) {
        a = a.$$typeof;
        if (a === Da) return 11;
        if (a === Ga) return 14;
    }
    return 2;
}
function Pg(a, b) {
    var c = a.alternate;
    null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
    c.flags = a.flags & 14680064;
    c.childLanes = a.childLanes;
    c.lanes = a.lanes;
    c.child = a.child;
    c.memoizedProps = a.memoizedProps;
    c.memoizedState = a.memoizedState;
    c.updateQueue = a.updateQueue;
    b = a.dependencies;
    c.dependencies = null === b ? null : {
        lanes: b.lanes,
        firstContext: b.firstContext
    };
    c.sibling = a.sibling;
    c.index = a.index;
    c.ref = a.ref;
    return c;
}
function Rg(a, b, c, d, e, f) {
    var g = 2;
    d = a;
    if ("function" === typeof a) aj(a) && (g = 1);
    else if ("string" === typeof a) g = 5;
    else a: switch(a){
        case ya:
            return Tg(c.children, e, f, b);
        case za:
            g = 8;
            e |= 8;
            break;
        case Aa:
            return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f, a;
        case Ea:
            return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f, a;
        case Fa:
            return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f, a;
        case Ia:
            return pj(c, e, f, b);
        default:
            if ("object" === typeof a && null !== a) switch(a.$$typeof){
                case Ba:
                    g = 10;
                    break a;
                case Ca:
                    g = 9;
                    break a;
                case Da:
                    g = 11;
                    break a;
                case Ga:
                    g = 14;
                    break a;
                case Ha:
                    g = 16;
                    d = null;
                    break a;
            }
            throw Error(p(130, null == a ? a : typeof a, ""));
    }
    b = Bg(g, c, b, e);
    b.elementType = a;
    b.type = d;
    b.lanes = f;
    return b;
}
function Tg(a, b, c, d) {
    a = Bg(7, a, d, b);
    a.lanes = c;
    return a;
}
function pj(a, b, c, d) {
    a = Bg(22, a, d, b);
    a.elementType = Ia;
    a.lanes = c;
    a.stateNode = {
        isHidden: !1
    };
    return a;
}
function Qg(a, b, c) {
    a = Bg(6, a, null, b);
    a.lanes = c;
    return a;
}
function Sg(a, b, c) {
    b = Bg(4, null !== a.children ? a.children : [], a.key, b);
    b.lanes = c;
    b.stateNode = {
        containerInfo: a.containerInfo,
        pendingChildren: null,
        implementation: a.implementation
    };
    return b;
}
function al(a, b, c, d, e) {
    this.tag = b;
    this.containerInfo = a;
    this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
    this.timeoutHandle = -1;
    this.callbackNode = this.pendingContext = this.context = null;
    this.callbackPriority = 0;
    this.eventTimes = zc(0);
    this.expirationTimes = zc(-1);
    this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
    this.entanglements = zc(0);
    this.identifierPrefix = d;
    this.onRecoverableError = e;
    this.mutableSourceEagerHydrationData = null;
}
function bl(a, b, c, d, e, f, g, h, k) {
    a = new al(a, b, c, h, k);
    1 === b ? (b = 1, !0 === f && (b |= 8)) : b = 0;
    f = Bg(3, null, null, b);
    a.current = f;
    f.stateNode = a;
    f.memoizedState = {
        element: d,
        isDehydrated: c,
        cache: null,
        transitions: null,
        pendingSuspenseBoundaries: null
    };
    kh(f);
    return a;
}
function cl(a, b, c) {
    var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
    return {
        $$typeof: wa,
        key: null == d ? null : "" + d,
        children: a,
        containerInfo: b,
        implementation: c
    };
}
function dl(a) {
    if (!a) return Vf;
    a = a._reactInternals;
    a: {
        if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
        var b = a;
        do {
            switch(b.tag){
                case 3:
                    b = b.stateNode.context;
                    break a;
                case 1:
                    if (Zf(b.type)) {
                        b = b.stateNode.__reactInternalMemoizedMergedChildContext;
                        break a;
                    }
            }
            b = b.return;
        }while (null !== b)
        throw Error(p(171));
    }
    if (1 === a.tag) {
        var c = a.type;
        if (Zf(c)) return bg(a, c, b);
    }
    return b;
}
function el(a, b, c, d, e, f, g, h, k) {
    a = bl(c, d, !0, a, e, f, g, h, k);
    a.context = dl(null);
    c = a.current;
    d = R();
    e = yi(c);
    f = mh(d, e);
    f.callback = void 0 !== b && null !== b ? b : null;
    nh(c, f, e);
    a.current.lanes = e;
    Ac(a, e, d);
    Dk(a, d);
    return a;
}
function fl(a, b, c, d) {
    var e = b.current, f = R(), g = yi(e);
    c = dl(c);
    null === b.context ? b.context = c : b.pendingContext = c;
    b = mh(f, g);
    b.payload = {
        element: a
    };
    d = void 0 === d ? null : d;
    null !== d && (b.callback = d);
    a = nh(e, b, g);
    null !== a && (gi(a, e, g, f), oh(a, e, g));
    return g;
}
function gl(a) {
    a = a.current;
    if (!a.child) return null;
    switch(a.child.tag){
        case 5:
            return a.child.stateNode;
        default:
            return a.child.stateNode;
    }
}
function hl(a, b) {
    a = a.memoizedState;
    if (null !== a && null !== a.dehydrated) {
        var c = a.retryLane;
        a.retryLane = 0 !== c && c < b ? c : b;
    }
}
function il(a, b) {
    hl(a, b);
    (a = a.alternate) && hl(a, b);
}
function jl() {
    return null;
}
var kl = "function" === typeof reportError ? reportError : function(a) {
    console.error(a);
};
function ll(a) {
    this._internalRoot = a;
}
ml.prototype.render = ll.prototype.render = function(a) {
    var b = this._internalRoot;
    if (null === b) throw Error(p(409));
    fl(a, b, null, null);
};
ml.prototype.unmount = ll.prototype.unmount = function() {
    var a = this._internalRoot;
    if (null !== a) {
        this._internalRoot = null;
        var b = a.containerInfo;
        Rk(function() {
            fl(null, a, null, null);
        });
        b[uf] = null;
    }
};
function ml(a) {
    this._internalRoot = a;
}
ml.prototype.unstable_scheduleHydration = function(a) {
    if (a) {
        var b = Hc();
        a = {
            blockedOn: null,
            target: a,
            priority: b
        };
        for(var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++);
        Qc.splice(c, 0, a);
        0 === c && Vc(a);
    }
};
function nl(a) {
    return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
}
function ol(a) {
    return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
}
function pl() {}
function ql(a, b, c, d, e) {
    if (e) {
        if ("function" === typeof d) {
            var f = d;
            d = function() {
                var a = gl(g);
                f.call(a);
            };
        }
        var g = el(b, d, a, 0, null, !1, !1, "", pl);
        a._reactRootContainer = g;
        a[uf] = g.current;
        sf(8 === a.nodeType ? a.parentNode : a);
        Rk();
        return g;
    }
    for(; e = a.lastChild;)a.removeChild(e);
    if ("function" === typeof d) {
        var h = d;
        d = function() {
            var a = gl(k);
            h.call(a);
        };
    }
    var k = bl(a, 0, !1, null, null, !1, !1, "", pl);
    a._reactRootContainer = k;
    a[uf] = k.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk(function() {
        fl(b, k, c, d);
    });
    return k;
}
function rl(a, b, c, d, e) {
    var f = c._reactRootContainer;
    if (f) {
        var g = f;
        if ("function" === typeof e) {
            var h = e;
            e = function() {
                var a = gl(g);
                h.call(a);
            };
        }
        fl(b, g, a, e);
    } else g = ql(c, b, a, e, d);
    return gl(g);
}
Ec = function(a) {
    switch(a.tag){
        case 3:
            var b = a.stateNode;
            if (b.current.memoizedState.isDehydrated) {
                var c = tc(b.pendingLanes);
                0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
            }
            break;
        case 13:
            Rk(function() {
                var b = ih(a, 1);
                if (null !== b) {
                    var c = R();
                    gi(b, a, 1, c);
                }
            }), il(a, 1);
    }
};
Fc = function(a) {
    if (13 === a.tag) {
        var b = ih(a, 134217728);
        if (null !== b) {
            var c = R();
            gi(b, a, 134217728, c);
        }
        il(a, 134217728);
    }
};
Gc = function(a) {
    if (13 === a.tag) {
        var b = yi(a), c = ih(a, b);
        if (null !== c) {
            var d = R();
            gi(c, a, b, d);
        }
        il(a, b);
    }
};
Hc = function() {
    return C;
};
Ic = function(a, b) {
    var c = C;
    try {
        return C = a, b();
    } finally{
        C = c;
    }
};
yb = function(a, b, c) {
    switch(b){
        case "input":
            bb(a, c);
            b = c.name;
            if ("radio" === c.type && null != b) {
                for(c = a; c.parentNode;)c = c.parentNode;
                c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
                for(b = 0; b < c.length; b++){
                    var d = c[b];
                    if (d !== a && d.form === a.form) {
                        var e = Db(d);
                        if (!e) throw Error(p(90));
                        Wa(d);
                        bb(d, e);
                    }
                }
            }
            break;
        case "textarea":
            ib(a, c);
            break;
        case "select":
            b = c.value, null != b && fb(a, !!c.multiple, b, !1);
    }
};
Gb = Qk;
Hb = Rk;
var sl = {
    usingClientEntryPoint: !1,
    Events: [
        Cb,
        ue,
        Db,
        Eb,
        Fb,
        Qk
    ]
}, tl = {
    findFiberByHostInstance: Wc,
    bundleType: 0,
    version: "18.3.1",
    rendererPackageName: "react-dom"
};
var ul = {
    bundleType: tl.bundleType,
    version: tl.version,
    rendererPackageName: tl.rendererPackageName,
    rendererConfig: tl.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef: ua.ReactCurrentDispatcher,
    findHostInstanceByFiber: function(a) {
        a = Zb(a);
        return null === a ? null : a.stateNode;
    },
    findFiberByHostInstance: tl.findFiberByHostInstance || jl,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: "18.3.1-next-f1338f8080-20240426"
};
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
    var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!vl.isDisabled && vl.supportsFiber) try {
        kc = vl.inject(ul), lc = vl;
    } catch (a) {}
}
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
exports.createPortal = function(a, b) {
    var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
    if (!nl(b)) throw Error(p(200));
    return cl(a, b, null, c);
};
exports.createRoot = function(a, b) {
    if (!nl(a)) throw Error(p(299));
    var c = !1, d = "", e = kl;
    null !== b && void 0 !== b && (!0 === b.unstable_strictMode && (c = !0), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
    b = bl(a, 1, !1, null, null, c, !1, d, e);
    a[uf] = b.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    return new ll(b);
};
exports.findDOMNode = function(a) {
    if (null == a) return null;
    if (1 === a.nodeType) return a;
    var b = a._reactInternals;
    if (void 0 === b) {
        if ("function" === typeof a.render) throw Error(p(188));
        a = Object.keys(a).join(",");
        throw Error(p(268, a));
    }
    a = Zb(b);
    a = null === a ? null : a.stateNode;
    return a;
};
exports.flushSync = function(a) {
    return Rk(a);
};
exports.hydrate = function(a, b, c) {
    if (!ol(b)) throw Error(p(200));
    return rl(null, a, b, !0, c);
};
exports.hydrateRoot = function(a, b, c) {
    if (!nl(a)) throw Error(p(405));
    var d = null != c && c.hydratedSources || null, e = !1, f = "", g = kl;
    null !== c && void 0 !== c && (!0 === c.unstable_strictMode && (e = !0), void 0 !== c.identifierPrefix && (f = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
    b = el(b, null, a, 1, null != c ? c : null, e, !1, f, g);
    a[uf] = b.current;
    sf(a);
    if (d) for(a = 0; a < d.length; a++)c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [
        c,
        e
    ] : b.mutableSourceEagerHydrationData.push(c, e);
    return new ml(b);
};
exports.render = function(a, b, c) {
    if (!ol(b)) throw Error(p(200));
    return rl(null, a, b, !1, c);
};
exports.unmountComponentAtNode = function(a) {
    if (!ol(a)) throw Error(p(40));
    return a._reactRootContainer ? (Rk(function() {
        rl(null, null, a, !1, function() {
            a._reactRootContainer = null;
            a[uf] = null;
        });
    }), !0) : !1;
};
exports.unstable_batchedUpdates = Qk;
exports.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
    if (!ol(c)) throw Error(p(200));
    if (null == a || void 0 === a._reactInternals) throw Error(p(38));
    return rl(a, b, c, !1, d);
};
exports.version = "18.3.1-next-f1338f8080-20240426";
}),
"634": (function (__unused_webpack_module, exports, __webpack_require__) {
'use strict';
var m = __webpack_require__("542");
var i;
exports.createRoot = m.createRoot;
exports.hydrateRoot = m.hydrateRoot;
}),
"542": (function (module, __unused_webpack_exports, __webpack_require__) {
'use strict';
function checkDCE() {
    /* global __REACT_DEVTOOLS_GLOBAL_HOOK__ */ if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined' || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== 'function') return;
    try {
        // Verify that the code above has been dead code eliminated (DCE'd).
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
    } catch (err) {
        // DevTools shouldn't crash React, no matter what.
        // We should still report in case we break this code.
        console.error(err);
    }
}
// DCE check should happen before ReactDOM bundle executes so that
// DevTools can report bad minification during injection.
checkDCE();
module.exports = __webpack_require__("577");
}),
"783": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
var react__WEBPACK_IMPORTED_MODULE_0___namespace_cache;
var react_dom__WEBPACK_IMPORTED_MODULE_1___namespace_cache;
__webpack_require__.d(__webpack_exports__, {
  aj: function() { return createBrowserRouter; },
  pG: function() { return RouterProvider; }
});
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");
/* harmony import */var react_dom__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("542");
/* harmony import */var react_router__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__("935");
/* harmony import */var _remix_run_router__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__("403");
/**
 * React Router DOM v6.26.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ 





function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
function _objectWithoutPropertiesLoose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
const defaultMethod = "get";
const defaultEncType = "application/x-www-form-urlencoded";
function isHtmlElement(object) {
    return object != null && typeof object.tagName === "string";
}
function isButtonElement(object) {
    return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}
function isFormElement(object) {
    return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}
function isInputElement(object) {
    return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
function isModifiedEvent(event) {
    return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
    return event.button === 0 && (// Ignore everything but left clicks
    !target || target === "_self") && // Let browser handle "target=_blank" etc.
    !isModifiedEvent(event) // Ignore clicks with modifier keys
    ;
}
/**
 * Creates a URLSearchParams object using the given initializer.
 *
 * This is identical to `new URLSearchParams(init)` except it also
 * supports arrays as values in the object form of the initializer
 * instead of just strings. This is convenient when you need multiple
 * values for a given key, but don't want to use an array initializer.
 *
 * For example, instead of:
 *
 *   let searchParams = new URLSearchParams([
 *     ['sort', 'name'],
 *     ['sort', 'price']
 *   ]);
 *
 * you can do:
 *
 *   let searchParams = createSearchParams({
 *     sort: ['name', 'price']
 *   });
 */ function createSearchParams(init) {
    if (init === void 0) init = "";
    return new URLSearchParams(typeof init === "string" || Array.isArray(init) || init instanceof URLSearchParams ? init : Object.keys(init).reduce((memo, key)=>{
        let value = init[key];
        return memo.concat(Array.isArray(value) ? value.map((v)=>[
                key,
                v
            ]) : [
            [
                key,
                value
            ]
        ]);
    }, []));
}
function getSearchParamsForLocation(locationSearch, defaultSearchParams) {
    let searchParams = createSearchParams(locationSearch);
    if (defaultSearchParams) // Use `defaultSearchParams.forEach(...)` here instead of iterating of
    // `defaultSearchParams.keys()` to work-around a bug in Firefox related to
    // web extensions. Relevant Bugzilla tickets:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1414602
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1023984
    defaultSearchParams.forEach((_, key)=>{
        if (!searchParams.has(key)) defaultSearchParams.getAll(key).forEach((value)=>{
            searchParams.append(key, value);
        });
    });
    return searchParams;
}
// One-time check for submitter support
let _formDataSupportsSubmitter = null;
function isFormDataSubmitterSupported() {
    if (_formDataSupportsSubmitter === null) try {
        new FormData(document.createElement("form"), // @ts-expect-error if FormData supports the submitter parameter, this will throw
        0);
        _formDataSupportsSubmitter = false;
    } catch (e) {
        _formDataSupportsSubmitter = true;
    }
    return _formDataSupportsSubmitter;
}
const supportedFormEncTypes = new Set([
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain"
]);
function getFormEncType(encType) {
    if (encType != null && !supportedFormEncTypes.has(encType)) return null;
    return encType;
}
function getFormSubmissionInfo(target, basename) {
    let method;
    let action;
    let encType;
    let formData;
    let body;
    if (isFormElement(target)) {
        // When grabbing the action from the element, it will have had the basename
        // prefixed to ensure non-JS scenarios work, so strip it since we'll
        // re-prefix in the router
        let attr = target.getAttribute("action");
        action = attr ? (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .stripBasename */.Zn)(attr, basename) : null;
        method = target.getAttribute("method") || defaultMethod;
        encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
        formData = new FormData(target);
    } else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
        let form = target.form;
        if (form == null) throw new Error("Cannot submit a <button> or <input type=\"submit\"> without a <form>");
        // <button>/<input type="submit"> may override attributes of <form>
        // When grabbing the action from the element, it will have had the basename
        // prefixed to ensure non-JS scenarios work, so strip it since we'll
        // re-prefix in the router
        let attr = target.getAttribute("formaction") || form.getAttribute("action");
        action = attr ? (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .stripBasename */.Zn)(attr, basename) : null;
        method = target.getAttribute("formmethod") || form.getAttribute("method") || defaultMethod;
        encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
        // Build a FormData object populated from a form and submitter
        formData = new FormData(form, target);
        // If this browser doesn't support the `FormData(el, submitter)` format,
        // then tack on the submitter value at the end.  This is a lightweight
        // solution that is not 100% spec compliant.  For complete support in older
        // browsers, consider using the `formdata-submitter-polyfill` package
        if (!isFormDataSubmitterSupported()) {
            let { name, type, value } = target;
            if (type === "image") {
                let prefix = name ? name + "." : "";
                formData.append(prefix + "x", "0");
                formData.append(prefix + "y", "0");
            } else if (name) formData.append(name, value);
        }
    } else if (isHtmlElement(target)) throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
    else {
        method = defaultMethod;
        action = null;
        encType = defaultEncType;
        body = target;
    }
    // Send body for <Form encType="text/plain" so we encode it into text
    if (formData && encType === "text/plain") {
        body = formData;
        formData = undefined;
    }
    return {
        action,
        method: method.toLowerCase(),
        encType,
        formData,
        body
    };
}
const _excluded = [
    "onClick",
    "relative",
    "reloadDocument",
    "replace",
    "state",
    "target",
    "to",
    "preventScrollReset",
    "unstable_viewTransition"
], _excluded2 = [
    "aria-current",
    "caseSensitive",
    "className",
    "end",
    "style",
    "to",
    "unstable_viewTransition",
    "children"
], _excluded3 = [
    "fetcherKey",
    "navigate",
    "reloadDocument",
    "replace",
    "state",
    "method",
    "action",
    "onSubmit",
    "relative",
    "preventScrollReset",
    "unstable_viewTransition"
];
// HEY YOU! DON'T TOUCH THIS VARIABLE!
//
// It is replaced with the proper version at build time via a babel plugin in
// the rollup config.
//
// Export a global property onto the window for React Router detection by the
// Core Web Vitals Technology Report.  This way they can configure the `wappalyzer`
// to detect and properly classify live websites as being built with React Router:
// https://github.com/HTTPArchive/wappalyzer/blob/main/src/technologies/r.json
const REACT_ROUTER_VERSION = "6";
try {
    window.__reactRouterVersion = REACT_ROUTER_VERSION;
} catch (e) {
// no-op
}
function createBrowserRouter(routes, opts) {
    return (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .createRouter */.p7)({
        basename: opts == null ? void 0 : opts.basename,
        future: _extends({}, opts == null ? void 0 : opts.future, {
            v7_prependBasename: true
        }),
        history: (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .createBrowserHistory */.lX)({
            window: opts == null ? void 0 : opts.window
        }),
        hydrationData: (opts == null ? void 0 : opts.hydrationData) || parseHydrationData(),
        routes,
        mapRouteProperties: react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_mapRouteProperties */.us,
        unstable_dataStrategy: opts == null ? void 0 : opts.unstable_dataStrategy,
        unstable_patchRoutesOnNavigation: opts == null ? void 0 : opts.unstable_patchRoutesOnNavigation,
        window: opts == null ? void 0 : opts.window
    }).initialize();
}
function createHashRouter(routes, opts) {
    return createRouter({
        basename: opts == null ? void 0 : opts.basename,
        future: _extends({}, opts == null ? void 0 : opts.future, {
            v7_prependBasename: true
        }),
        history: createHashHistory({
            window: opts == null ? void 0 : opts.window
        }),
        hydrationData: (opts == null ? void 0 : opts.hydrationData) || parseHydrationData(),
        routes,
        mapRouteProperties: UNSAFE_mapRouteProperties,
        unstable_dataStrategy: opts == null ? void 0 : opts.unstable_dataStrategy,
        unstable_patchRoutesOnNavigation: opts == null ? void 0 : opts.unstable_patchRoutesOnNavigation,
        window: opts == null ? void 0 : opts.window
    }).initialize();
}
function parseHydrationData() {
    var _window;
    let state = (_window = window) == null ? void 0 : _window.__staticRouterHydrationData;
    if (state && state.errors) state = _extends({}, state, {
        errors: deserializeErrors(state.errors)
    });
    return state;
}
function deserializeErrors(errors) {
    if (!errors) return null;
    let entries = Object.entries(errors);
    let serialized = {};
    for (let [key, val] of entries){
        // Hey you!  If you change this, please change the corresponding logic in
        // serializeErrors in react-router-dom/server.tsx :)
        if (val && val.__type === "RouteErrorResponse") serialized[key] = new _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .UNSAFE_ErrorResponseImpl */.OF(val.status, val.statusText, val.data, val.internal === true);
        else if (val && val.__type === "Error") {
            // Attempt to reconstruct the right type of Error (i.e., ReferenceError)
            if (val.__subType) {
                let ErrorConstructor = window[val.__subType];
                if (typeof ErrorConstructor === "function") try {
                    // @ts-expect-error
                    let error = new ErrorConstructor(val.message);
                    // Wipe away the client-side stack trace.  Nothing to fill it in with
                    // because we don't serialize SSR stack traces for security reasons
                    error.stack = "";
                    serialized[key] = error;
                } catch (e) {
                // no-op - fall through and create a normal Error
                }
            }
            if (serialized[key] == null) {
                let error = new Error(val.message);
                // Wipe away the client-side stack trace.  Nothing to fill it in with
                // because we don't serialize SSR stack traces for security reasons
                error.stack = "";
                serialized[key] = error;
            }
        } else serialized[key] = val;
    }
    return serialized;
}
const ViewTransitionContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext({
    isTransitioning: false
});
const FetchersContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext(new Map());
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region Components
////////////////////////////////////////////////////////////////////////////////
/**
  Webpack + React 17 fails to compile on any of the following because webpack
  complains that `startTransition` doesn't exist in `React`:
  * import { startTransition } from "react"
  * import * as React from from "react";
    "startTransition" in React ? React.startTransition(() => setState()) : setState()
  * import * as React from from "react";
    "startTransition" in React ? React["startTransition"](() => setState()) : setState()

  Moving it to a constant such as the following solves the Webpack/React 17 issue:
  * import * as React from from "react";
    const START_TRANSITION = "startTransition";
    START_TRANSITION in React ? React[START_TRANSITION](() => setState()) : setState()

  However, that introduces webpack/terser minification issues in production builds
  in React 18 where minification/obfuscation ends up removing the call of
  React.startTransition entirely from the first half of the ternary.  Grabbing
  this exported reference once up front resolves that issue.

  See https://github.com/remix-run/react-router/issues/10579
*/ const START_TRANSITION = "startTransition";
const startTransitionImpl = /*#__PURE__*/ (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache || (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache = __webpack_require__.t(react__WEBPACK_IMPORTED_MODULE_0__, 2)))[START_TRANSITION];
const FLUSH_SYNC = "flushSync";
const flushSyncImpl = /*#__PURE__*/ (react_dom__WEBPACK_IMPORTED_MODULE_1___namespace_cache || (react_dom__WEBPACK_IMPORTED_MODULE_1___namespace_cache = __webpack_require__.t(react_dom__WEBPACK_IMPORTED_MODULE_1__, 2)))[FLUSH_SYNC];
const USE_ID = "useId";
const useIdImpl = /*#__PURE__*/ (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache || (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache = __webpack_require__.t(react__WEBPACK_IMPORTED_MODULE_0__, 2)))[USE_ID];
function startTransitionSafe(cb) {
    if (startTransitionImpl) startTransitionImpl(cb);
    else cb();
}
function flushSyncSafe(cb) {
    if (flushSyncImpl) flushSyncImpl(cb);
    else cb();
}
class Deferred {
    constructor(){
        this.status = "pending";
        this.promise = new Promise((resolve, reject)=>{
            this.resolve = (value)=>{
                if (this.status === "pending") {
                    this.status = "resolved";
                    resolve(value);
                }
            };
            this.reject = (reason)=>{
                if (this.status === "pending") {
                    this.status = "rejected";
                    reject(reason);
                }
            };
        });
    }
}
/**
 * Given a Remix Router instance, render the appropriate UI
 */ function RouterProvider(_ref) {
    let { fallbackElement, router, future } = _ref;
    let [state, setStateImpl] = react__WEBPACK_IMPORTED_MODULE_0__.useState(router.state);
    let [pendingState, setPendingState] = react__WEBPACK_IMPORTED_MODULE_0__.useState();
    let [vtContext, setVtContext] = react__WEBPACK_IMPORTED_MODULE_0__.useState({
        isTransitioning: false
    });
    let [renderDfd, setRenderDfd] = react__WEBPACK_IMPORTED_MODULE_0__.useState();
    let [transition, setTransition] = react__WEBPACK_IMPORTED_MODULE_0__.useState();
    let [interruption, setInterruption] = react__WEBPACK_IMPORTED_MODULE_0__.useState();
    let fetcherData = react__WEBPACK_IMPORTED_MODULE_0__.useRef(new Map());
    let { v7_startTransition } = future || {};
    let optInStartTransition = react__WEBPACK_IMPORTED_MODULE_0__.useCallback((cb)=>{
        if (v7_startTransition) startTransitionSafe(cb);
        else cb();
    }, [
        v7_startTransition
    ]);
    let setState = react__WEBPACK_IMPORTED_MODULE_0__.useCallback((newState, _ref2)=>{
        let { deletedFetchers, unstable_flushSync: flushSync, unstable_viewTransitionOpts: viewTransitionOpts } = _ref2;
        deletedFetchers.forEach((key)=>fetcherData.current.delete(key));
        newState.fetchers.forEach((fetcher, key)=>{
            if (fetcher.data !== undefined) fetcherData.current.set(key, fetcher.data);
        });
        let isViewTransitionUnavailable = router.window == null || router.window.document == null || typeof router.window.document.startViewTransition !== "function";
        // If this isn't a view transition or it's not available in this browser,
        // just update and be done with it
        if (!viewTransitionOpts || isViewTransitionUnavailable) {
            if (flushSync) flushSyncSafe(()=>setStateImpl(newState));
            else optInStartTransition(()=>setStateImpl(newState));
            return;
        }
        // flushSync + startViewTransition
        if (flushSync) {
            // Flush through the context to mark DOM elements as transition=ing
            flushSyncSafe(()=>{
                // Cancel any pending transitions
                if (transition) {
                    renderDfd && renderDfd.resolve();
                    transition.skipTransition();
                }
                setVtContext({
                    isTransitioning: true,
                    flushSync: true,
                    currentLocation: viewTransitionOpts.currentLocation,
                    nextLocation: viewTransitionOpts.nextLocation
                });
            });
            // Update the DOM
            let t = router.window.document.startViewTransition(()=>{
                flushSyncSafe(()=>setStateImpl(newState));
            });
            // Clean up after the animation completes
            t.finished.finally(()=>{
                flushSyncSafe(()=>{
                    setRenderDfd(undefined);
                    setTransition(undefined);
                    setPendingState(undefined);
                    setVtContext({
                        isTransitioning: false
                    });
                });
            });
            flushSyncSafe(()=>setTransition(t));
            return;
        }
        // startTransition + startViewTransition
        if (transition) {
            // Interrupting an in-progress transition, cancel and let everything flush
            // out, and then kick off a new transition from the interruption state
            renderDfd && renderDfd.resolve();
            transition.skipTransition();
            setInterruption({
                state: newState,
                currentLocation: viewTransitionOpts.currentLocation,
                nextLocation: viewTransitionOpts.nextLocation
            });
        } else {
            // Completed navigation update with opted-in view transitions, let 'er rip
            setPendingState(newState);
            setVtContext({
                isTransitioning: true,
                flushSync: false,
                currentLocation: viewTransitionOpts.currentLocation,
                nextLocation: viewTransitionOpts.nextLocation
            });
        }
    }, [
        router.window,
        transition,
        renderDfd,
        fetcherData,
        optInStartTransition
    ]);
    // Need to use a layout effect here so we are subscribed early enough to
    // pick up on any render-driven redirects/navigations (useEffect/<Navigate>)
    react__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect(()=>router.subscribe(setState), [
        router,
        setState
    ]);
    // When we start a view transition, create a Deferred we can use for the
    // eventual "completed" render
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(()=>{
        if (vtContext.isTransitioning && !vtContext.flushSync) setRenderDfd(new Deferred());
    }, [
        vtContext
    ]);
    // Once the deferred is created, kick off startViewTransition() to update the
    // DOM and then wait on the Deferred to resolve (indicating the DOM update has
    // happened)
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(()=>{
        if (renderDfd && pendingState && router.window) {
            let newState = pendingState;
            let renderPromise = renderDfd.promise;
            let transition = router.window.document.startViewTransition(async ()=>{
                optInStartTransition(()=>setStateImpl(newState));
                await renderPromise;
            });
            transition.finished.finally(()=>{
                setRenderDfd(undefined);
                setTransition(undefined);
                setPendingState(undefined);
                setVtContext({
                    isTransitioning: false
                });
            });
            setTransition(transition);
        }
    }, [
        optInStartTransition,
        pendingState,
        renderDfd,
        router.window
    ]);
    // When the new location finally renders and is committed to the DOM, this
    // effect will run to resolve the transition
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(()=>{
        if (renderDfd && pendingState && state.location.key === pendingState.location.key) renderDfd.resolve();
    }, [
        renderDfd,
        transition,
        state.location,
        pendingState
    ]);
    // If we get interrupted with a new navigation during a transition, we skip
    // the active transition, let it cleanup, then kick it off again here
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(()=>{
        if (!vtContext.isTransitioning && interruption) {
            setPendingState(interruption.state);
            setVtContext({
                isTransitioning: true,
                flushSync: false,
                currentLocation: interruption.currentLocation,
                nextLocation: interruption.nextLocation
            });
            setInterruption(undefined);
        }
    }, [
        vtContext.isTransitioning,
        interruption
    ]);
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(()=>{
    // Only log this once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    let navigator = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>{
        return {
            createHref: router.createHref,
            encodeLocation: router.encodeLocation,
            go: (n)=>router.navigate(n),
            push: (to, state, opts)=>router.navigate(to, {
                    state,
                    preventScrollReset: opts == null ? void 0 : opts.preventScrollReset
                }),
            replace: (to, state, opts)=>router.navigate(to, {
                    replace: true,
                    state,
                    preventScrollReset: opts == null ? void 0 : opts.preventScrollReset
                })
        };
    }, [
        router
    ]);
    let basename = router.basename || "/";
    let dataRouterContext = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>({
            router,
            navigator,
            static: false,
            basename
        }), [
        router,
        navigator,
        basename
    ]);
    let routerFuture = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>({
            v7_relativeSplatPath: router.future.v7_relativeSplatPath
        }), [
        router.future.v7_relativeSplatPath
    ]);
    // The fragment and {null} here are important!  We need them to keep React 18's
    // useId happy when we are server-rendering since we may have a <script> here
    // containing the hydrated server-side staticContext (from StaticRouterProvider).
    // useId relies on the component tree structure to generate deterministic id's
    // so we need to ensure it remains the same on the client even though
    // we don't need the <script> tag
    return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_DataRouterContext.Provider */.w3.Provider, {
        value: dataRouterContext
    }, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_DataRouterStateContext.Provider */.FR.Provider, {
        value: state
    }, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(FetchersContext.Provider, {
        value: fetcherData.current
    }, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(ViewTransitionContext.Provider, {
        value: vtContext
    }, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .Router */.F0), {
        basename: basename,
        location: state.location,
        navigationType: state.historyAction,
        navigator: navigator,
        future: routerFuture
    }, state.initialized || router.future.v7_partialHydration ? /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(MemoizedDataRoutes, {
        routes: router.routes,
        future: router.future,
        state: state
    }) : fallbackElement))))), null);
}
// Memoize to avoid re-renders when updating `ViewTransitionContext`
const MemoizedDataRoutes = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.memo(DataRoutes);
function DataRoutes(_ref3) {
    let { routes, future, state } = _ref3;
    return (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_useRoutesImpl */.DY)(routes, undefined, state, future);
}
/**
 * A `<Router>` for use in web browsers. Provides the cleanest URLs.
 */ function BrowserRouter(_ref4) {
    let { basename, children, future, window: window1 } = _ref4;
    let historyRef = React.useRef();
    if (historyRef.current == null) historyRef.current = createBrowserHistory({
        window: window1,
        v5Compat: true
    });
    let history = historyRef.current;
    let [state, setStateImpl] = React.useState({
        action: history.action,
        location: history.location
    });
    let { v7_startTransition } = future || {};
    let setState = React.useCallback((newState)=>{
        v7_startTransition && startTransitionImpl ? startTransitionImpl(()=>setStateImpl(newState)) : setStateImpl(newState);
    }, [
        setStateImpl,
        v7_startTransition
    ]);
    React.useLayoutEffect(()=>history.listen(setState), [
        history,
        setState
    ]);
    return /*#__PURE__*/ React.createElement(Router, {
        basename: basename,
        children: children,
        location: state.location,
        navigationType: state.action,
        navigator: history,
        future: future
    });
}
/**
 * A `<Router>` for use in web browsers. Stores the location in the hash
 * portion of the URL so it is not sent to the server.
 */ function HashRouter(_ref5) {
    let { basename, children, future, window: window1 } = _ref5;
    let historyRef = React.useRef();
    if (historyRef.current == null) historyRef.current = createHashHistory({
        window: window1,
        v5Compat: true
    });
    let history = historyRef.current;
    let [state, setStateImpl] = React.useState({
        action: history.action,
        location: history.location
    });
    let { v7_startTransition } = future || {};
    let setState = React.useCallback((newState)=>{
        v7_startTransition && startTransitionImpl ? startTransitionImpl(()=>setStateImpl(newState)) : setStateImpl(newState);
    }, [
        setStateImpl,
        v7_startTransition
    ]);
    React.useLayoutEffect(()=>history.listen(setState), [
        history,
        setState
    ]);
    return /*#__PURE__*/ React.createElement(Router, {
        basename: basename,
        children: children,
        location: state.location,
        navigationType: state.action,
        navigator: history,
        future: future
    });
}
/**
 * A `<Router>` that accepts a pre-instantiated history object. It's important
 * to note that using your own history object is highly discouraged and may add
 * two versions of the history library to your bundles unless you use the same
 * version of the history library that React Router uses internally.
 */ function HistoryRouter(_ref6) {
    let { basename, children, future, history } = _ref6;
    let [state, setStateImpl] = React.useState({
        action: history.action,
        location: history.location
    });
    let { v7_startTransition } = future || {};
    let setState = React.useCallback((newState)=>{
        v7_startTransition && startTransitionImpl ? startTransitionImpl(()=>setStateImpl(newState)) : setStateImpl(newState);
    }, [
        setStateImpl,
        v7_startTransition
    ]);
    React.useLayoutEffect(()=>history.listen(setState), [
        history,
        setState
    ]);
    return /*#__PURE__*/ React.createElement(Router, {
        basename: basename,
        children: children,
        location: state.location,
        navigationType: state.action,
        navigator: history,
        future: future
    });
}
const isBrowser = typeof window !== "undefined" && typeof window.document !== "undefined" && typeof window.document.createElement !== "undefined";
const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
/**
 * The public API for rendering a history-aware `<a>`.
 */ const Link = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.forwardRef(function LinkWithRef(_ref7, ref) {
    let { onClick, relative, reloadDocument, replace, state, target, to, preventScrollReset, unstable_viewTransition } = _ref7, rest = _objectWithoutPropertiesLoose(_ref7, _excluded);
    let { basename } = react__WEBPACK_IMPORTED_MODULE_0__.useContext((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_NavigationContext */.Us));
    // Rendered into <a href> for absolute URLs
    let absoluteHref;
    let isExternal = false;
    if (typeof to === "string" && ABSOLUTE_URL_REGEX.test(to)) {
        // Render the absolute href server- and client-side
        absoluteHref = to;
        // Only check for external origins client-side
        if (isBrowser) try {
            let currentUrl = new URL(window.location.href);
            let targetUrl = to.startsWith("//") ? new URL(currentUrl.protocol + to) : new URL(to);
            let path = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .stripBasename */.Zn)(targetUrl.pathname, basename);
            if (targetUrl.origin === currentUrl.origin && path != null) // Strip the protocol/origin/basename for same-origin absolute URLs
            to = path + targetUrl.search + targetUrl.hash;
            else isExternal = true;
        } catch (e) {}
    }
    // Rendered into <a href> for relative URLs
    let href = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useHref */.oQ)(to, {
        relative
    });
    let internalOnClick = useLinkClickHandler(to, {
        replace,
        state,
        target,
        preventScrollReset,
        relative,
        unstable_viewTransition
    });
    function handleClick(event) {
        if (onClick) onClick(event);
        if (!event.defaultPrevented) internalOnClick(event);
    }
    return(/*#__PURE__*/ // eslint-disable-next-line jsx-a11y/anchor-has-content
    react__WEBPACK_IMPORTED_MODULE_0__.createElement("a", _extends({}, rest, {
        href: absoluteHref || href,
        onClick: isExternal || reloadDocument ? onClick : handleClick,
        ref: ref,
        target: target
    })));
});
/**
 * A `<Link>` wrapper that knows if it's "active" or not.
 */ const NavLink = /*#__PURE__*/ (/* unused pure expression or super */ null && (react__WEBPACK_IMPORTED_MODULE_0__.forwardRef(function NavLinkWithRef(_ref8, ref) {
    let { "aria-current": ariaCurrentProp = "page", caseSensitive = false, className: classNameProp = "", end = false, style: styleProp, to, unstable_viewTransition, children } = _ref8, rest = _objectWithoutPropertiesLoose(_ref8, _excluded2);
    let path = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useResolvedPath */.WU)(to, {
        relative: rest.relative
    });
    let location = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useLocation */.TH)();
    let routerState = react__WEBPACK_IMPORTED_MODULE_0__.useContext((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_DataRouterStateContext */.FR));
    let { navigator, basename } = react__WEBPACK_IMPORTED_MODULE_0__.useContext((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_NavigationContext */.Us));
    let isTransitioning = routerState != null && // Conditional usage is OK here because the usage of a data router is static
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useViewTransitionState(path) && unstable_viewTransition === true;
    let toPathname = navigator.encodeLocation ? navigator.encodeLocation(path).pathname : path.pathname;
    let locationPathname = location.pathname;
    let nextLocationPathname = routerState && routerState.navigation && routerState.navigation.location ? routerState.navigation.location.pathname : null;
    if (!caseSensitive) {
        locationPathname = locationPathname.toLowerCase();
        nextLocationPathname = nextLocationPathname ? nextLocationPathname.toLowerCase() : null;
        toPathname = toPathname.toLowerCase();
    }
    if (nextLocationPathname && basename) nextLocationPathname = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .stripBasename */.Zn)(nextLocationPathname, basename) || nextLocationPathname;
    // If the `to` has a trailing slash, look at that exact spot.  Otherwise,
    // we're looking for a slash _after_ what's in `to`.  For example:
    //
    // <NavLink to="/users"> and <NavLink to="/users/">
    // both want to look for a / at index 6 to match URL `/users/matt`
    const endSlashPosition = toPathname !== "/" && toPathname.endsWith("/") ? toPathname.length - 1 : toPathname.length;
    let isActive = locationPathname === toPathname || !end && locationPathname.startsWith(toPathname) && locationPathname.charAt(endSlashPosition) === "/";
    let isPending = nextLocationPathname != null && (nextLocationPathname === toPathname || !end && nextLocationPathname.startsWith(toPathname) && nextLocationPathname.charAt(toPathname.length) === "/");
    let renderProps = {
        isActive,
        isPending,
        isTransitioning
    };
    let ariaCurrent = isActive ? ariaCurrentProp : undefined;
    let className;
    if (typeof classNameProp === "function") className = classNameProp(renderProps);
    else // If the className prop is not a function, we use a default `active`
    // class for <NavLink />s that are active. In v5 `active` was the default
    // value for `activeClassName`, but we are removing that API and can still
    // use the old default behavior for a cleaner upgrade path and keep the
    // simple styling rules working as they currently do.
    className = [
        classNameProp,
        isActive ? "active" : null,
        isPending ? "pending" : null,
        isTransitioning ? "transitioning" : null
    ].filter(Boolean).join(" ");
    let style = typeof styleProp === "function" ? styleProp(renderProps) : styleProp;
    return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(Link, _extends({}, rest, {
        "aria-current": ariaCurrent,
        className: className,
        ref: ref,
        style: style,
        to: to,
        unstable_viewTransition: unstable_viewTransition
    }), typeof children === "function" ? children(renderProps) : children);
})));
/**
 * A `@remix-run/router`-aware `<form>`. It behaves like a normal form except
 * that the interaction with the server is with `fetch` instead of new document
 * requests, allowing components to add nicer UX to the page as the form is
 * submitted and returns with data.
 */ const Form = /*#__PURE__*/ (/* unused pure expression or super */ null && (react__WEBPACK_IMPORTED_MODULE_0__.forwardRef((_ref9, forwardedRef)=>{
    let { fetcherKey, navigate, reloadDocument, replace, state, method = defaultMethod, action, onSubmit, relative, preventScrollReset, unstable_viewTransition } = _ref9, props = _objectWithoutPropertiesLoose(_ref9, _excluded3);
    let submit = useSubmit();
    let formAction = useFormAction(action, {
        relative
    });
    let formMethod = method.toLowerCase() === "get" ? "get" : "post";
    let submitHandler = (event)=>{
        onSubmit && onSubmit(event);
        if (event.defaultPrevented) return;
        event.preventDefault();
        let submitter = event.nativeEvent.submitter;
        let submitMethod = (submitter == null ? void 0 : submitter.getAttribute("formmethod")) || method;
        submit(submitter || event.currentTarget, {
            fetcherKey,
            method: submitMethod,
            navigate,
            replace,
            state,
            relative,
            preventScrollReset,
            unstable_viewTransition
        });
    };
    return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement("form", _extends({
        ref: forwardedRef,
        method: formMethod,
        action: formAction,
        onSubmit: reloadDocument ? onSubmit : submitHandler
    }, props));
})));
/**
 * This component will emulate the browser's scroll restoration on location
 * changes.
 */ function ScrollRestoration(_ref10) {
    let { getKey, storageKey } = _ref10;
    useScrollRestoration({
        getKey,
        storageKey
    });
    return null;
}
//#endregion
////////////////////////////////////////////////////////////////////////////////
//#region Hooks
////////////////////////////////////////////////////////////////////////////////
var DataRouterHook;
(function(DataRouterHook) {
    DataRouterHook["UseScrollRestoration"] = "useScrollRestoration";
    DataRouterHook["UseSubmit"] = "useSubmit";
    DataRouterHook["UseSubmitFetcher"] = "useSubmitFetcher";
    DataRouterHook["UseFetcher"] = "useFetcher";
    DataRouterHook["useViewTransitionState"] = "useViewTransitionState";
})(DataRouterHook || (DataRouterHook = {}));
var DataRouterStateHook;
(function(DataRouterStateHook) {
    DataRouterStateHook["UseFetcher"] = "useFetcher";
    DataRouterStateHook["UseFetchers"] = "useFetchers";
    DataRouterStateHook["UseScrollRestoration"] = "useScrollRestoration";
})(DataRouterStateHook || (DataRouterStateHook = {}));
// Internal hooks
function getDataRouterConsoleError(hookName) {
    return hookName + " must be used within a data router.  See https://reactrouter.com/routers/picking-a-router.";
}
function useDataRouterContext(hookName) {
    let ctx = react__WEBPACK_IMPORTED_MODULE_0__.useContext((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_DataRouterContext */.w3));
    !ctx && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .UNSAFE_invariant */.J0)(false);
    return ctx;
}
function useDataRouterState(hookName) {
    let state = React.useContext(UNSAFE_DataRouterStateContext);
    !state && UNSAFE_invariant(false);
    return state;
}
// External hooks
/**
 * Handles the click behavior for router `<Link>` components. This is useful if
 * you need to create custom `<Link>` components with the same click behavior we
 * use in our exported `<Link>`.
 */ function useLinkClickHandler(to, _temp) {
    let { target, replace: replaceProp, state, preventScrollReset, relative, unstable_viewTransition } = _temp === void 0 ? {} : _temp;
    let navigate = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useNavigate */.s0)();
    let location = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useLocation */.TH)();
    let path = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useResolvedPath */.WU)(to, {
        relative
    });
    return react__WEBPACK_IMPORTED_MODULE_0__.useCallback((event)=>{
        if (shouldProcessLinkClick(event, target)) {
            event.preventDefault();
            // If the URL hasn't changed, a regular <a> will do a replace instead of
            // a push, so do the same here unless the replace prop is explicitly set
            let replace = replaceProp !== undefined ? replaceProp : (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .createPath */.Ep)(location) === (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .createPath */.Ep)(path);
            navigate(to, {
                replace,
                state,
                preventScrollReset,
                relative,
                unstable_viewTransition
            });
        }
    }, [
        location,
        navigate,
        path,
        replaceProp,
        state,
        target,
        to,
        preventScrollReset,
        relative,
        unstable_viewTransition
    ]);
}
/**
 * A convenient wrapper for reading and writing search parameters via the
 * URLSearchParams interface.
 */ function useSearchParams(defaultInit) {
    let defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit));
    let hasSetSearchParamsRef = React.useRef(false);
    let location = useLocation();
    let searchParams = React.useMemo(()=>// Only merge in the defaults if we haven't yet called setSearchParams.
        // Once we call that we want those to take precedence, otherwise you can't
        // remove a param with setSearchParams({}) if it has an initial value
        getSearchParamsForLocation(location.search, hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current), [
        location.search
    ]);
    let navigate = useNavigate();
    let setSearchParams = React.useCallback((nextInit, navigateOptions)=>{
        const newSearchParams = createSearchParams(typeof nextInit === "function" ? nextInit(searchParams) : nextInit);
        hasSetSearchParamsRef.current = true;
        navigate("?" + newSearchParams, navigateOptions);
    }, [
        navigate,
        searchParams
    ]);
    return [
        searchParams,
        setSearchParams
    ];
}
function validateClientSideSubmission() {
    if (typeof document === "undefined") throw new Error("You are calling submit during the server render. Try calling submit within a `useEffect` or callback instead.");
}
let fetcherId = 0;
let getUniqueFetcherId = ()=>"__" + String(++fetcherId) + "__";
/**
 * Returns a function that may be used to programmatically submit a form (or
 * some arbitrary data) to the server.
 */ function useSubmit() {
    let { router } = useDataRouterContext(DataRouterHook.UseSubmit);
    let { basename } = react__WEBPACK_IMPORTED_MODULE_0__.useContext((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_NavigationContext */.Us));
    let currentRouteId = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_useRouteId */.Yi)();
    return react__WEBPACK_IMPORTED_MODULE_0__.useCallback(function(target, options) {
        if (options === void 0) options = {};
        validateClientSideSubmission();
        let { action, method, encType, formData, body } = getFormSubmissionInfo(target, basename);
        if (options.navigate === false) {
            let key = options.fetcherKey || getUniqueFetcherId();
            router.fetch(key, currentRouteId, options.action || action, {
                preventScrollReset: options.preventScrollReset,
                formData,
                body,
                formMethod: options.method || method,
                formEncType: options.encType || encType,
                unstable_flushSync: options.unstable_flushSync
            });
        } else router.navigate(options.action || action, {
            preventScrollReset: options.preventScrollReset,
            formData,
            body,
            formMethod: options.method || method,
            formEncType: options.encType || encType,
            replace: options.replace,
            state: options.state,
            fromRouteId: currentRouteId,
            unstable_flushSync: options.unstable_flushSync,
            unstable_viewTransition: options.unstable_viewTransition
        });
    }, [
        router,
        basename,
        currentRouteId
    ]);
}
// v7: Eventually we should deprecate this entirely in favor of using the
// router method directly?
function useFormAction(action, _temp2) {
    let { relative } = _temp2 === void 0 ? {} : _temp2;
    let { basename } = react__WEBPACK_IMPORTED_MODULE_0__.useContext((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_NavigationContext */.Us));
    let routeContext = react__WEBPACK_IMPORTED_MODULE_0__.useContext((0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .UNSAFE_RouteContext */.pW));
    !routeContext && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .UNSAFE_invariant */.J0)(false);
    let [match] = routeContext.matches.slice(-1);
    // Shallow clone path so we can modify it below, otherwise we modify the
    // object referenced by useMemo inside useResolvedPath
    let path = _extends({}, (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useResolvedPath */.WU)(action ? action : ".", {
        relative
    }));
    // If no action was specified, browsers will persist current search params
    // when determining the path, so match that behavior
    // https://github.com/remix-run/remix/issues/927
    let location = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useLocation */.TH)();
    if (action == null) {
        // Safe to write to this directly here since if action was undefined, we
        // would have called useResolvedPath(".") which will never include a search
        path.search = location.search;
        // When grabbing search params from the URL, remove any included ?index param
        // since it might not apply to our contextual route.  We add it back based
        // on match.route.index below
        let params = new URLSearchParams(path.search);
        if (params.has("index") && params.get("index") === "") {
            params.delete("index");
            path.search = params.toString() ? "?" + params.toString() : "";
        }
    }
    if ((!action || action === ".") && match.route.index) path.search = path.search ? path.search.replace(/^\?/, "?index&") : "?index";
    // If we're operating within a basename, prepend it to the pathname prior
    // to creating the form action.  If this is a root navigation, then just use
    // the raw basename which allows the basename to have full control over the
    // presence of a trailing slash on root actions
    if (basename !== "/") path.pathname = path.pathname === "/" ? basename : (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .joinPaths */.RQ)([
        basename,
        path.pathname
    ]);
    return (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .createPath */.Ep)(path);
}
// TODO: (v7) Change the useFetcher generic default from `any` to `unknown`
/**
 * Interacts with route loaders and actions without causing a navigation. Great
 * for any interaction that stays on the same page.
 */ function useFetcher(_temp3) {
    var _route$matches;
    let { key } = _temp3 === void 0 ? {} : _temp3;
    let { router } = useDataRouterContext(DataRouterHook.UseFetcher);
    let state = useDataRouterState(DataRouterStateHook.UseFetcher);
    let fetcherData = React.useContext(FetchersContext);
    let route = React.useContext(UNSAFE_RouteContext);
    let routeId = (_route$matches = route.matches[route.matches.length - 1]) == null ? void 0 : _route$matches.route.id;
    !fetcherData && UNSAFE_invariant(false);
    !route && UNSAFE_invariant(false);
    !(routeId != null) && UNSAFE_invariant(false);
    // Fetcher key handling
    // OK to call conditionally to feature detect `useId`
    // eslint-disable-next-line react-hooks/rules-of-hooks
    let defaultKey = useIdImpl ? useIdImpl() : "";
    let [fetcherKey, setFetcherKey] = React.useState(key || defaultKey);
    if (key && key !== fetcherKey) setFetcherKey(key);
    else if (!fetcherKey) // We will only fall through here when `useId` is not available
    setFetcherKey(getUniqueFetcherId());
    // Registration/cleanup
    React.useEffect(()=>{
        router.getFetcher(fetcherKey);
        return ()=>{
            // Tell the router we've unmounted - if v7_fetcherPersist is enabled this
            // will not delete immediately but instead queue up a delete after the
            // fetcher returns to an `idle` state
            router.deleteFetcher(fetcherKey);
        };
    }, [
        router,
        fetcherKey
    ]);
    // Fetcher additions
    let load = React.useCallback((href, opts)=>{
        !routeId && UNSAFE_invariant(false);
        router.fetch(fetcherKey, routeId, href, opts);
    }, [
        fetcherKey,
        routeId,
        router
    ]);
    let submitImpl = useSubmit();
    let submit = React.useCallback((target, opts)=>{
        submitImpl(target, _extends({}, opts, {
            navigate: false,
            fetcherKey
        }));
    }, [
        fetcherKey,
        submitImpl
    ]);
    let FetcherForm = React.useMemo(()=>{
        let FetcherForm = /*#__PURE__*/ React.forwardRef((props, ref)=>{
            return /*#__PURE__*/ React.createElement(Form, _extends({}, props, {
                navigate: false,
                fetcherKey: fetcherKey,
                ref: ref
            }));
        });
        return FetcherForm;
    }, [
        fetcherKey
    ]);
    // Exposed FetcherWithComponents
    let fetcher = state.fetchers.get(fetcherKey) || IDLE_FETCHER;
    let data = fetcherData.get(fetcherKey);
    let fetcherWithComponents = React.useMemo(()=>_extends({
            Form: FetcherForm,
            submit,
            load
        }, fetcher, {
            data
        }), [
        FetcherForm,
        submit,
        load,
        fetcher,
        data
    ]);
    return fetcherWithComponents;
}
/**
 * Provides all fetchers currently on the page. Useful for layouts and parent
 * routes that need to provide pending/optimistic UI regarding the fetch.
 */ function useFetchers() {
    let state = useDataRouterState(DataRouterStateHook.UseFetchers);
    return Array.from(state.fetchers.entries()).map((_ref11)=>{
        let [key, fetcher] = _ref11;
        return _extends({}, fetcher, {
            key
        });
    });
}
const SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
let savedScrollPositions = (/* unused pure expression or super */ null && ({}));
/**
 * When rendered inside a RouterProvider, will restore scroll positions on navigations
 */ function useScrollRestoration(_temp4) {
    let { getKey, storageKey } = _temp4 === void 0 ? {} : _temp4;
    let { router } = useDataRouterContext(DataRouterHook.UseScrollRestoration);
    let { restoreScrollPosition, preventScrollReset } = useDataRouterState(DataRouterStateHook.UseScrollRestoration);
    let { basename } = React.useContext(UNSAFE_NavigationContext);
    let location = useLocation();
    let matches = useMatches();
    let navigation = useNavigation();
    // Trigger manual scroll restoration while we're active
    React.useEffect(()=>{
        window.history.scrollRestoration = "manual";
        return ()=>{
            window.history.scrollRestoration = "auto";
        };
    }, []);
    // Save positions on pagehide
    usePageHide(React.useCallback(()=>{
        if (navigation.state === "idle") {
            let key = (getKey ? getKey(location, matches) : null) || location.key;
            savedScrollPositions[key] = window.scrollY;
        }
        try {
            sessionStorage.setItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY, JSON.stringify(savedScrollPositions));
        } catch (error) {}
        window.history.scrollRestoration = "auto";
    }, [
        storageKey,
        getKey,
        navigation.state,
        location,
        matches
    ]));
    // Read in any saved scroll locations
    if (typeof document !== "undefined") {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useLayoutEffect(()=>{
            try {
                let sessionPositions = sessionStorage.getItem(storageKey || SCROLL_RESTORATION_STORAGE_KEY);
                if (sessionPositions) savedScrollPositions = JSON.parse(sessionPositions);
            } catch (e) {
            // no-op, use default empty object
            }
        }, [
            storageKey
        ]);
        // Enable scroll restoration in the router
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useLayoutEffect(()=>{
            let getKeyWithoutBasename = getKey && basename !== "/" ? (location, matches)=>getKey(_extends({}, location, {
                    pathname: stripBasename(location.pathname, basename) || location.pathname
                }), matches) : getKey;
            let disableScrollRestoration = router == null ? void 0 : router.enableScrollRestoration(savedScrollPositions, ()=>window.scrollY, getKeyWithoutBasename);
            return ()=>disableScrollRestoration && disableScrollRestoration();
        }, [
            router,
            basename,
            getKey
        ]);
        // Restore scrolling when state.restoreScrollPosition changes
        // eslint-disable-next-line react-hooks/rules-of-hooks
        React.useLayoutEffect(()=>{
            // Explicit false means don't do anything (used for submissions)
            if (restoreScrollPosition === false) return;
            // been here before, scroll to it
            if (typeof restoreScrollPosition === "number") {
                window.scrollTo(0, restoreScrollPosition);
                return;
            }
            // try to scroll to the hash
            if (location.hash) {
                let el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
                if (el) {
                    el.scrollIntoView();
                    return;
                }
            }
            // Don't reset if this navigation opted out
            if (preventScrollReset === true) return;
            // otherwise go to the top on new locations
            window.scrollTo(0, 0);
        }, [
            location,
            restoreScrollPosition,
            preventScrollReset
        ]);
    }
}
/**
 * Setup a callback to be fired on the window's `beforeunload` event. This is
 * useful for saving some data to `window.localStorage` just before the page
 * refreshes.
 *
 * Note: The `callback` argument should be a function created with
 * `React.useCallback()`.
 */ function useBeforeUnload(callback, options) {
    let { capture } = options || {};
    React.useEffect(()=>{
        let opts = capture != null ? {
            capture
        } : undefined;
        window.addEventListener("beforeunload", callback, opts);
        return ()=>{
            window.removeEventListener("beforeunload", callback, opts);
        };
    }, [
        callback,
        capture
    ]);
}
/**
 * Setup a callback to be fired on the window's `pagehide` event. This is
 * useful for saving some data to `window.localStorage` just before the page
 * refreshes.  This event is better supported than beforeunload across browsers.
 *
 * Note: The `callback` argument should be a function created with
 * `React.useCallback()`.
 */ function usePageHide(callback, options) {
    let { capture } = options || {};
    React.useEffect(()=>{
        let opts = capture != null ? {
            capture
        } : undefined;
        window.addEventListener("pagehide", callback, opts);
        return ()=>{
            window.removeEventListener("pagehide", callback, opts);
        };
    }, [
        callback,
        capture
    ]);
}
/**
 * Wrapper around useBlocker to show a window.confirm prompt to users instead
 * of building a custom UI with useBlocker.
 *
 * Warning: This has *a lot of rough edges* and behaves very differently (and
 * very incorrectly in some cases) across browsers if user click addition
 * back/forward navigations while the confirm is open.  Use at your own risk.
 */ function usePrompt(_ref12) {
    let { when, message } = _ref12;
    let blocker = useBlocker(when);
    React.useEffect(()=>{
        if (blocker.state === "blocked") {
            let proceed = window.confirm(message);
            if (proceed) // This timeout is needed to avoid a weird "race" on POP navigations
            // between the `window.history` revert navigation and the result of
            // `window.confirm`
            setTimeout(blocker.proceed, 0);
            else blocker.reset();
        }
    }, [
        blocker,
        message
    ]);
    React.useEffect(()=>{
        if (blocker.state === "blocked" && !when) blocker.reset();
    }, [
        blocker,
        when
    ]);
}
/**
 * Return a boolean indicating if there is an active view transition to the
 * given href.  You can use this value to render CSS classes or viewTransitionName
 * styles onto your elements
 *
 * @param href The destination href
 * @param [opts.relative] Relative routing type ("route" | "path")
 */ function useViewTransitionState(to, opts) {
    if (opts === void 0) opts = {};
    let vtContext = react__WEBPACK_IMPORTED_MODULE_0__.useContext(ViewTransitionContext);
    !(vtContext != null) && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .UNSAFE_invariant */.J0)(false);
    let { basename } = useDataRouterContext(DataRouterHook.useViewTransitionState);
    let path = (0, react_router__WEBPACK_IMPORTED_MODULE_3__/* .useResolvedPath */.WU)(to, {
        relative: opts.relative
    });
    if (!vtContext.isTransitioning) return false;
    let currentPath = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .stripBasename */.Zn)(vtContext.currentLocation.pathname, basename) || vtContext.currentLocation.pathname;
    let nextPath = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .stripBasename */.Zn)(vtContext.nextLocation.pathname, basename) || vtContext.nextLocation.pathname;
    // Transition is active if we're going to or coming from the indicated
    // destination.  This ensures that other PUSH navigations that reverse
    // an indicated transition apply.  I.e., on the list view you have:
    //
    //   <NavLink to="/details/1" unstable_viewTransition>
    //
    // If you click the breadcrumb back to the list view:
    //
    //   <NavLink to="/list" unstable_viewTransition>
    //
    // We should apply the transition because it's indicated as active going
    // from /list -> /details/1 and therefore should be active on the reverse
    // (even though this isn't strictly a POP reverse)
    return (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .matchPath */.LX)(path.pathname, nextPath) != null || (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_2__/* .matchPath */.LX)(path.pathname, currentPath) != null;
}
//#endregion
 //# sourceMappingURL=index.js.map
}),
"935": (function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
"use strict";
var react__WEBPACK_IMPORTED_MODULE_0___namespace_cache;
__webpack_require__.d(__webpack_exports__, {
  DY: function() { return useRoutesImpl; },
  F0: function() { return Router; },
  FR: function() { return DataRouterStateContext; },
  Fg: function() { return Navigate; },
  TH: function() { return useLocation; },
  UO: function() { return useParams; },
  Us: function() { return NavigationContext; },
  WU: function() { return useResolvedPath; },
  Yi: function() { return useRouteId; },
  oQ: function() { return useHref; },
  pW: function() { return RouteContext; },
  s0: function() { return useNavigate; },
  us: function() { return mapRouteProperties; },
  w3: function() { return DataRouterContext; }
});
/* harmony import */var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__("378");
/* harmony import */var _remix_run_router__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__("403");
/**
 * React Router v6.26.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */ 


function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source)if (Object.prototype.hasOwnProperty.call(source, key)) target[key] = source[key];
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
// Create react-specific types from the agnostic types in @remix-run/router to
// export from react-router
const DataRouterContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext(null);
const DataRouterStateContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext(null);
const AwaitContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext(null);
/**
 * A Navigator is a "location changer"; it's how you get to different locations.
 *
 * Every history instance conforms to the Navigator interface, but the
 * distinction is useful primarily when it comes to the low-level `<Router>` API
 * where both the location and a navigator must be provided separately in order
 * to avoid "tearing" that may occur in a suspense-enabled app if the action
 * and/or location were to be read directly from the history instance.
 */ const NavigationContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext(null);
const LocationContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext(null);
const RouteContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext({
    outlet: null,
    matches: [],
    isDataRoute: false
});
const RouteErrorContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createContext(null);
/**
 * Returns the full href for the given "to" value. This is useful for building
 * custom links that are also accessible and preserve right-click behavior.
 *
 * @see https://reactrouter.com/hooks/use-href
 */ function useHref(to, _temp) {
    let { relative } = _temp === void 0 ? {} : _temp;
    !useInRouterContext() && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    let { basename, navigator } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(NavigationContext);
    let { hash, pathname, search } = useResolvedPath(to, {
        relative
    });
    let joinedPathname = pathname;
    // If we're operating within a basename, prepend it to the pathname prior
    // to creating the href.  If this is a root navigation, then just use the raw
    // basename which allows the basename to have full control over the presence
    // of a trailing slash on root links
    if (basename !== "/") joinedPathname = pathname === "/" ? basename : (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .joinPaths */.RQ)([
        basename,
        pathname
    ]);
    return navigator.createHref({
        pathname: joinedPathname,
        search,
        hash
    });
}
/**
 * Returns true if this component is a descendant of a `<Router>`.
 *
 * @see https://reactrouter.com/hooks/use-in-router-context
 */ function useInRouterContext() {
    return react__WEBPACK_IMPORTED_MODULE_0__.useContext(LocationContext) != null;
}
/**
 * Returns the current location object, which represents the current URL in web
 * browsers.
 *
 * Note: If you're using this it may mean you're doing some of your own
 * "routing" in your app, and we'd like to know what your use case is. We may
 * be able to provide something higher-level to better suit your needs.
 *
 * @see https://reactrouter.com/hooks/use-location
 */ function useLocation() {
    !useInRouterContext() && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    return react__WEBPACK_IMPORTED_MODULE_0__.useContext(LocationContext).location;
}
/**
 * Returns the current navigation action which describes how the router came to
 * the current location, either by a pop, push, or replace on the history stack.
 *
 * @see https://reactrouter.com/hooks/use-navigation-type
 */ function useNavigationType() {
    return React.useContext(LocationContext).navigationType;
}
/**
 * Returns a PathMatch object if the given pattern matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * `<NavLink>`.
 *
 * @see https://reactrouter.com/hooks/use-match
 */ function useMatch(pattern) {
    !useInRouterContext() && UNSAFE_invariant(false);
    let { pathname } = useLocation();
    return React.useMemo(()=>matchPath(pattern, UNSAFE_decodePath(pathname)), [
        pathname,
        pattern
    ]);
}
/**
 * The interface for the navigate() function returned from useNavigate().
 */ const navigateEffectWarning = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
// Mute warnings for calls to useNavigate in SSR environments
function useIsomorphicLayoutEffect(cb) {
    let isStatic = react__WEBPACK_IMPORTED_MODULE_0__.useContext(NavigationContext).static;
    if (!isStatic) // We should be able to get rid of this once react 18.3 is released
    // See: https://github.com/facebook/react/pull/26395
    // eslint-disable-next-line react-hooks/rules-of-hooks
    react__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect(cb);
}
/**
 * Returns an imperative method for changing the location. Used by `<Link>`s, but
 * may also be used by other elements to change the location.
 *
 * @see https://reactrouter.com/hooks/use-navigate
 */ function useNavigate() {
    let { isDataRoute } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteContext);
    // Conditional usage is OK here because the usage of a data router is static
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}
function useNavigateUnstable() {
    !useInRouterContext() && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    let dataRouterContext = react__WEBPACK_IMPORTED_MODULE_0__.useContext(DataRouterContext);
    let { basename, future, navigator } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(NavigationContext);
    let { matches } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteContext);
    let { pathname: locationPathname } = useLocation();
    let routePathnamesJson = JSON.stringify((0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_getResolveToMatches */.cm)(matches, future.v7_relativeSplatPath));
    let activeRef = react__WEBPACK_IMPORTED_MODULE_0__.useRef(false);
    useIsomorphicLayoutEffect(()=>{
        activeRef.current = true;
    });
    let navigate = react__WEBPACK_IMPORTED_MODULE_0__.useCallback(function(to, options) {
        if (options === void 0) options = {};
        // Short circuit here since if this happens on first render the navigate
        // is useless because we haven't wired up our history listener yet
        if (!activeRef.current) return;
        if (typeof to === "number") {
            navigator.go(to);
            return;
        }
        let path = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .resolveTo */.pC)(to, JSON.parse(routePathnamesJson), locationPathname, options.relative === "path");
        // If we're operating within a basename, prepend it to the pathname prior
        // to handing off to history (but only if we're not in a data router,
        // otherwise it'll prepend the basename inside of the router).
        // If this is a root navigation, then we navigate to the raw basename
        // which allows the basename to have full control over the presence of a
        // trailing slash on root links
        if (dataRouterContext == null && basename !== "/") path.pathname = path.pathname === "/" ? basename : (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .joinPaths */.RQ)([
            basename,
            path.pathname
        ]);
        (!!options.replace ? navigator.replace : navigator.push)(path, options.state, options);
    }, [
        basename,
        navigator,
        routePathnamesJson,
        locationPathname,
        dataRouterContext
    ]);
    return navigate;
}
const OutletContext = /*#__PURE__*/ (/* unused pure expression or super */ null && (react__WEBPACK_IMPORTED_MODULE_0__.createContext(null)));
/**
 * Returns the context (if provided) for the child route at this level of the route
 * hierarchy.
 * @see https://reactrouter.com/hooks/use-outlet-context
 */ function useOutletContext() {
    return React.useContext(OutletContext);
}
/**
 * Returns the element for the child route at this level of the route
 * hierarchy. Used internally by `<Outlet>` to render child routes.
 *
 * @see https://reactrouter.com/hooks/use-outlet
 */ function useOutlet(context) {
    let outlet = React.useContext(RouteContext).outlet;
    if (outlet) return /*#__PURE__*/ React.createElement(OutletContext.Provider, {
        value: context
    }, outlet);
    return outlet;
}
/**
 * Returns an object of key/value pairs of the dynamic params from the current
 * URL that were matched by the route path.
 *
 * @see https://reactrouter.com/hooks/use-params
 */ function useParams() {
    let { matches } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteContext);
    let routeMatch = matches[matches.length - 1];
    return routeMatch ? routeMatch.params : {};
}
/**
 * Resolves the pathname of the given `to` value against the current location.
 *
 * @see https://reactrouter.com/hooks/use-resolved-path
 */ function useResolvedPath(to, _temp2) {
    let { relative } = _temp2 === void 0 ? {} : _temp2;
    let { future } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(NavigationContext);
    let { matches } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteContext);
    let { pathname: locationPathname } = useLocation();
    let routePathnamesJson = JSON.stringify((0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_getResolveToMatches */.cm)(matches, future.v7_relativeSplatPath));
    return react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>(0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .resolveTo */.pC)(to, JSON.parse(routePathnamesJson), locationPathname, relative === "path"), [
        to,
        routePathnamesJson,
        locationPathname,
        relative
    ]);
}
/**
 * Returns the element of the route that matched the current location, prepared
 * with the correct context to render the remainder of the route tree. Route
 * elements in the tree must render an `<Outlet>` to render their child route's
 * element.
 *
 * @see https://reactrouter.com/hooks/use-routes
 */ function useRoutes(routes, locationArg) {
    return useRoutesImpl(routes, locationArg);
}
// Internal implementation with accept optional param for RouterProvider usage
function useRoutesImpl(routes, locationArg, dataRouterState, future) {
    !useInRouterContext() && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    let { navigator } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(NavigationContext);
    let { matches: parentMatches } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteContext);
    let routeMatch = parentMatches[parentMatches.length - 1];
    let parentParams = routeMatch ? routeMatch.params : {};
    let parentPathname = routeMatch ? routeMatch.pathname : "/";
    let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
    let parentRoute = routeMatch && routeMatch.route;
    let locationFromContext = useLocation();
    let location;
    if (locationArg) {
        var _parsedLocationArg$pa;
        let parsedLocationArg = typeof locationArg === "string" ? (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .parsePath */.cP)(locationArg) : locationArg;
        !(parentPathnameBase === "/" || ((_parsedLocationArg$pa = parsedLocationArg.pathname) == null ? void 0 : _parsedLocationArg$pa.startsWith(parentPathnameBase))) && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
        location = parsedLocationArg;
    } else location = locationFromContext;
    let pathname = location.pathname || "/";
    let remainingPathname = pathname;
    if (parentPathnameBase !== "/") {
        // Determine the remaining pathname by removing the # of URL segments the
        // parentPathnameBase has, instead of removing based on character count.
        // This is because we can't guarantee that incoming/outgoing encodings/
        // decodings will match exactly.
        // We decode paths before matching on a per-segment basis with
        // decodeURIComponent(), but we re-encode pathnames via `new URL()` so they
        // match what `window.location.pathname` would reflect.  Those don't 100%
        // align when it comes to encoded URI characters such as % and &.
        //
        // So we may end up with:
        //   pathname:           "/descendant/a%25b/match"
        //   parentPathnameBase: "/descendant/a%b"
        //
        // And the direct substring removal approach won't work :/
        let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
        let segments = pathname.replace(/^\//, "").split("/");
        remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
    }
    let matches = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .matchRoutes */.fp)(routes, {
        pathname: remainingPathname
    });
    let renderedMatches = _renderMatches(matches && matches.map((match)=>Object.assign({}, match, {
            params: Object.assign({}, parentParams, match.params),
            pathname: (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .joinPaths */.RQ)([
                parentPathnameBase,
                // Re-encode pathnames that were decoded inside matchRoutes
                navigator.encodeLocation ? navigator.encodeLocation(match.pathname).pathname : match.pathname
            ]),
            pathnameBase: match.pathnameBase === "/" ? parentPathnameBase : (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .joinPaths */.RQ)([
                parentPathnameBase,
                // Re-encode pathnames that were decoded inside matchRoutes
                navigator.encodeLocation ? navigator.encodeLocation(match.pathnameBase).pathname : match.pathnameBase
            ])
        })), parentMatches, dataRouterState, future);
    // When a user passes in a `locationArg`, the associated routes need to
    // be wrapped in a new `LocationContext.Provider` in order for `useLocation`
    // to use the scoped location instead of the global location.
    if (locationArg && renderedMatches) return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(LocationContext.Provider, {
        value: {
            location: _extends({
                pathname: "/",
                search: "",
                hash: "",
                state: null,
                key: "default"
            }, location),
            navigationType: _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .Action.Pop */.aU.Pop
        }
    }, renderedMatches);
    return renderedMatches;
}
function DefaultErrorComponent() {
    let error = useRouteError();
    let message = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .isRouteErrorResponse */.WK)(error) ? error.status + " " + error.statusText : error instanceof Error ? error.message : JSON.stringify(error);
    let stack = error instanceof Error ? error.stack : null;
    let lightgrey = "rgba(200,200,200, 0.5)";
    let preStyles = {
        padding: "0.5rem",
        backgroundColor: lightgrey
    };
    let codeStyles = {
        padding: "2px 4px",
        backgroundColor: lightgrey
    };
    let devInfo = null;
    return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement("h2", null, "Unexpected Application Error!"), /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement("h3", {
        style: {
            fontStyle: "italic"
        }
    }, message), stack ? /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement("pre", {
        style: preStyles
    }, stack) : null, devInfo);
}
const defaultErrorElement = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(DefaultErrorComponent, null);
class RenderErrorBoundary extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(props){
        super(props);
        this.state = {
            location: props.location,
            revalidation: props.revalidation,
            error: props.error
        };
    }
    static getDerivedStateFromError(error) {
        return {
            error: error
        };
    }
    static getDerivedStateFromProps(props, state) {
        // When we get into an error state, the user will likely click "back" to the
        // previous page that didn't have an error. Because this wraps the entire
        // application, that will have no effect--the error page continues to display.
        // This gives us a mechanism to recover from the error when the location changes.
        //
        // Whether we're in an error state or not, we update the location in state
        // so that when we are in an error state, it gets reset when a new location
        // comes in and the user recovers from the error.
        if (state.location !== props.location || state.revalidation !== "idle" && props.revalidation === "idle") return {
            error: props.error,
            location: props.location,
            revalidation: props.revalidation
        };
        // If we're not changing locations, preserve the location but still surface
        // any new errors that may come through. We retain the existing error, we do
        // this because the error provided from the app state may be cleared without
        // the location changing.
        return {
            error: props.error !== undefined ? props.error : state.error,
            location: state.location,
            revalidation: props.revalidation || state.revalidation
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error("React Router caught the following error during render", error, errorInfo);
    }
    render() {
        return this.state.error !== undefined ? /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(RouteContext.Provider, {
            value: this.props.routeContext
        }, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(RouteErrorContext.Provider, {
            value: this.state.error,
            children: this.props.component
        })) : this.props.children;
    }
}
function RenderedRoute(_ref) {
    let { routeContext, match, children } = _ref;
    let dataRouterContext = react__WEBPACK_IMPORTED_MODULE_0__.useContext(DataRouterContext);
    // Track how deep we got in our render pass to emulate SSR componentDidCatch
    // in a DataStaticRouter
    if (dataRouterContext && dataRouterContext.static && dataRouterContext.staticContext && (match.route.errorElement || match.route.ErrorBoundary)) dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
    return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(RouteContext.Provider, {
        value: routeContext
    }, children);
}
function _renderMatches(matches, parentMatches, dataRouterState, future) {
    var _dataRouterState;
    if (parentMatches === void 0) parentMatches = [];
    if (dataRouterState === void 0) dataRouterState = null;
    if (future === void 0) future = null;
    if (matches == null) {
        var _future;
        if (!dataRouterState) return null;
        if (dataRouterState.errors) // Don't bail if we have data router errors so we can render them in the
        // boundary.  Use the pre-matched (or shimmed) matches
        matches = dataRouterState.matches;
        else if ((_future = future) != null && _future.v7_partialHydration && parentMatches.length === 0 && !dataRouterState.initialized && dataRouterState.matches.length > 0) // Don't bail if we're initializing with partial hydration and we have
        // router matches.  That means we're actively running `patchRoutesOnNavigation`
        // so we should render down the partial matches to the appropriate
        // `HydrateFallback`.  We only do this if `parentMatches` is empty so it
        // only impacts the root matches for `RouterProvider` and no descendant
        // `<Routes>`
        matches = dataRouterState.matches;
        else return null;
    }
    let renderedMatches = matches;
    // If we have data errors, trim matches to the highest error boundary
    let errors = (_dataRouterState = dataRouterState) == null ? void 0 : _dataRouterState.errors;
    if (errors != null) {
        let errorIndex = renderedMatches.findIndex((m)=>m.route.id && (errors == null ? void 0 : errors[m.route.id]) !== undefined);
        !(errorIndex >= 0) && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
        renderedMatches = renderedMatches.slice(0, Math.min(renderedMatches.length, errorIndex + 1));
    }
    // If we're in a partial hydration mode, detect if we need to render down to
    // a given HydrateFallback while we load the rest of the hydration data
    let renderFallback = false;
    let fallbackIndex = -1;
    if (dataRouterState && future && future.v7_partialHydration) for(let i = 0; i < renderedMatches.length; i++){
        let match = renderedMatches[i];
        // Track the deepest fallback up until the first route without data
        if (match.route.HydrateFallback || match.route.hydrateFallbackElement) fallbackIndex = i;
        if (match.route.id) {
            let { loaderData, errors } = dataRouterState;
            let needsToRunLoader = match.route.loader && loaderData[match.route.id] === undefined && (!errors || errors[match.route.id] === undefined);
            if (match.route.lazy || needsToRunLoader) {
                // We found the first route that's not ready to render (waiting on
                // lazy, or has a loader that hasn't run yet).  Flag that we need to
                // render a fallback and render up until the appropriate fallback
                renderFallback = true;
                if (fallbackIndex >= 0) renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
                else renderedMatches = [
                    renderedMatches[0]
                ];
                break;
            }
        }
    }
    return renderedMatches.reduceRight((outlet, match, index)=>{
        // Only data routers handle errors/fallbacks
        let error;
        let shouldRenderHydrateFallback = false;
        let errorElement = null;
        let hydrateFallbackElement = null;
        if (dataRouterState) {
            error = errors && match.route.id ? errors[match.route.id] : undefined;
            errorElement = match.route.errorElement || defaultErrorElement;
            if (renderFallback) {
                if (fallbackIndex < 0 && index === 0) {
                    warningOnce("route-fallback", false, "No `HydrateFallback` element provided to render during initial hydration");
                    shouldRenderHydrateFallback = true;
                    hydrateFallbackElement = null;
                } else if (fallbackIndex === index) {
                    shouldRenderHydrateFallback = true;
                    hydrateFallbackElement = match.route.hydrateFallbackElement || null;
                }
            }
        }
        let matches = parentMatches.concat(renderedMatches.slice(0, index + 1));
        let getChildren = ()=>{
            let children;
            if (error) children = errorElement;
            else if (shouldRenderHydrateFallback) children = hydrateFallbackElement;
            else if (match.route.Component) // Note: This is a de-optimized path since React won't re-use the
            // ReactElement since it's identity changes with each new
            // React.createElement call.  We keep this so folks can use
            // `<Route Component={...}>` in `<Routes>` but generally `Component`
            // usage is only advised in `RouterProvider` when we can convert it to
            // `element` ahead of time.
            children = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(match.route.Component, null);
            else if (match.route.element) children = match.route.element;
            else children = outlet;
            return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(RenderedRoute, {
                match: match,
                routeContext: {
                    outlet,
                    matches,
                    isDataRoute: dataRouterState != null
                },
                children: children
            });
        };
        // Only wrap in an error boundary within data router usages when we have an
        // ErrorBoundary/errorElement on this route.  Otherwise let it bubble up to
        // an ancestor ErrorBoundary/errorElement
        return dataRouterState && (match.route.ErrorBoundary || match.route.errorElement || index === 0) ? /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(RenderErrorBoundary, {
            location: dataRouterState.location,
            revalidation: dataRouterState.revalidation,
            component: errorElement,
            error: error,
            children: getChildren(),
            routeContext: {
                outlet: null,
                matches,
                isDataRoute: true
            }
        }) : getChildren();
    }, null);
}
var DataRouterHook = /*#__PURE__*/ function(DataRouterHook) {
    DataRouterHook["UseBlocker"] = "useBlocker";
    DataRouterHook["UseRevalidator"] = "useRevalidator";
    DataRouterHook["UseNavigateStable"] = "useNavigate";
    return DataRouterHook;
}(DataRouterHook || {});
var DataRouterStateHook = /*#__PURE__*/ function(DataRouterStateHook) {
    DataRouterStateHook["UseBlocker"] = "useBlocker";
    DataRouterStateHook["UseLoaderData"] = "useLoaderData";
    DataRouterStateHook["UseActionData"] = "useActionData";
    DataRouterStateHook["UseRouteError"] = "useRouteError";
    DataRouterStateHook["UseNavigation"] = "useNavigation";
    DataRouterStateHook["UseRouteLoaderData"] = "useRouteLoaderData";
    DataRouterStateHook["UseMatches"] = "useMatches";
    DataRouterStateHook["UseRevalidator"] = "useRevalidator";
    DataRouterStateHook["UseNavigateStable"] = "useNavigate";
    DataRouterStateHook["UseRouteId"] = "useRouteId";
    return DataRouterStateHook;
}(DataRouterStateHook || {});
function getDataRouterConsoleError(hookName) {
    return hookName + " must be used within a data router.  See https://reactrouter.com/routers/picking-a-router.";
}
function useDataRouterContext(hookName) {
    let ctx = react__WEBPACK_IMPORTED_MODULE_0__.useContext(DataRouterContext);
    !ctx && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    return ctx;
}
function useDataRouterState(hookName) {
    let state = react__WEBPACK_IMPORTED_MODULE_0__.useContext(DataRouterStateContext);
    !state && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    return state;
}
function useRouteContext(hookName) {
    let route = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteContext);
    !route && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    return route;
}
// Internal version with hookName-aware debugging
function useCurrentRouteId(hookName) {
    let route = useRouteContext(hookName);
    let thisRoute = route.matches[route.matches.length - 1];
    !thisRoute.route.id && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    return thisRoute.route.id;
}
/**
 * Returns the ID for the nearest contextual route
 */ function useRouteId() {
    return useCurrentRouteId(DataRouterStateHook.UseRouteId);
}
/**
 * Returns the current navigation, defaulting to an "idle" navigation when
 * no navigation is in progress
 */ function useNavigation() {
    let state = useDataRouterState(DataRouterStateHook.UseNavigation);
    return state.navigation;
}
/**
 * Returns a revalidate function for manually triggering revalidation, as well
 * as the current state of any manual revalidations
 */ function useRevalidator() {
    let dataRouterContext = useDataRouterContext(DataRouterHook.UseRevalidator);
    let state = useDataRouterState(DataRouterStateHook.UseRevalidator);
    return React.useMemo(()=>({
            revalidate: dataRouterContext.router.revalidate,
            state: state.revalidation
        }), [
        dataRouterContext.router.revalidate,
        state.revalidation
    ]);
}
/**
 * Returns the active route matches, useful for accessing loaderData for
 * parent/child routes or the route "handle" property
 */ function useMatches() {
    let { matches, loaderData } = useDataRouterState(DataRouterStateHook.UseMatches);
    return React.useMemo(()=>matches.map((m)=>UNSAFE_convertRouteMatchToUiMatch(m, loaderData)), [
        matches,
        loaderData
    ]);
}
/**
 * Returns the loader data for the nearest ancestor Route loader
 */ function useLoaderData() {
    let state = useDataRouterState(DataRouterStateHook.UseLoaderData);
    let routeId = useCurrentRouteId(DataRouterStateHook.UseLoaderData);
    if (state.errors && state.errors[routeId] != null) {
        console.error("You cannot `useLoaderData` in an errorElement (routeId: " + routeId + ")");
        return undefined;
    }
    return state.loaderData[routeId];
}
/**
 * Returns the loaderData for the given routeId
 */ function useRouteLoaderData(routeId) {
    let state = useDataRouterState(DataRouterStateHook.UseRouteLoaderData);
    return state.loaderData[routeId];
}
/**
 * Returns the action data for the nearest ancestor Route action
 */ function useActionData() {
    let state = useDataRouterState(DataRouterStateHook.UseActionData);
    let routeId = useCurrentRouteId(DataRouterStateHook.UseLoaderData);
    return state.actionData ? state.actionData[routeId] : undefined;
}
/**
 * Returns the nearest ancestor Route error, which could be a loader/action
 * error or a render error.  This is intended to be called from your
 * ErrorBoundary/errorElement to display a proper error message.
 */ function useRouteError() {
    var _state$errors;
    let error = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteErrorContext);
    let state = useDataRouterState(DataRouterStateHook.UseRouteError);
    let routeId = useCurrentRouteId(DataRouterStateHook.UseRouteError);
    // If this was a render error, we put it in a RouteError context inside
    // of RenderErrorBoundary
    if (error !== undefined) return error;
    // Otherwise look for errors from our data router state
    return (_state$errors = state.errors) == null ? void 0 : _state$errors[routeId];
}
/**
 * Returns the happy-path data from the nearest ancestor `<Await />` value
 */ function useAsyncValue() {
    let value = React.useContext(AwaitContext);
    return value == null ? void 0 : value._data;
}
/**
 * Returns the error from the nearest ancestor `<Await />` value
 */ function useAsyncError() {
    let value = React.useContext(AwaitContext);
    return value == null ? void 0 : value._error;
}
let blockerId = 0;
/**
 * Allow the application to block navigations within the SPA and present the
 * user a confirmation dialog to confirm the navigation.  Mostly used to avoid
 * using half-filled form data.  This does not handle hard-reloads or
 * cross-origin navigations.
 */ function useBlocker(shouldBlock) {
    let { router, basename } = useDataRouterContext(DataRouterHook.UseBlocker);
    let state = useDataRouterState(DataRouterStateHook.UseBlocker);
    let [blockerKey, setBlockerKey] = React.useState("");
    let blockerFunction = React.useCallback((arg)=>{
        if (typeof shouldBlock !== "function") return !!shouldBlock;
        if (basename === "/") return shouldBlock(arg);
        // If they provided us a function and we've got an active basename, strip
        // it from the locations we expose to the user to match the behavior of
        // useLocation
        let { currentLocation, nextLocation, historyAction } = arg;
        return shouldBlock({
            currentLocation: _extends({}, currentLocation, {
                pathname: stripBasename(currentLocation.pathname, basename) || currentLocation.pathname
            }),
            nextLocation: _extends({}, nextLocation, {
                pathname: stripBasename(nextLocation.pathname, basename) || nextLocation.pathname
            }),
            historyAction
        });
    }, [
        basename,
        shouldBlock
    ]);
    // This effect is in charge of blocker key assignment and deletion (which is
    // tightly coupled to the key)
    React.useEffect(()=>{
        let key = String(++blockerId);
        setBlockerKey(key);
        return ()=>router.deleteBlocker(key);
    }, [
        router
    ]);
    // This effect handles assigning the blockerFunction.  This is to handle
    // unstable blocker function identities, and happens only after the prior
    // effect so we don't get an orphaned blockerFunction in the router with a
    // key of "".  Until then we just have the IDLE_BLOCKER.
    React.useEffect(()=>{
        if (blockerKey !== "") router.getBlocker(blockerKey, blockerFunction);
    }, [
        router,
        blockerKey,
        blockerFunction
    ]);
    // Prefer the blocker from `state` not `router.state` since DataRouterContext
    // is memoized so this ensures we update on blocker state updates
    return blockerKey && state.blockers.has(blockerKey) ? state.blockers.get(blockerKey) : IDLE_BLOCKER;
}
/**
 * Stable version of useNavigate that is used when we are in the context of
 * a RouterProvider.
 */ function useNavigateStable() {
    let { router } = useDataRouterContext(DataRouterHook.UseNavigateStable);
    let id = useCurrentRouteId(DataRouterStateHook.UseNavigateStable);
    let activeRef = react__WEBPACK_IMPORTED_MODULE_0__.useRef(false);
    useIsomorphicLayoutEffect(()=>{
        activeRef.current = true;
    });
    let navigate = react__WEBPACK_IMPORTED_MODULE_0__.useCallback(function(to, options) {
        if (options === void 0) options = {};
        // Short circuit here since if this happens on first render the navigate
        // is useless because we haven't wired up our router subscriber yet
        if (!activeRef.current) return;
        if (typeof to === "number") router.navigate(to);
        else router.navigate(to, _extends({
            fromRouteId: id
        }, options));
    }, [
        router,
        id
    ]);
    return navigate;
}
const alreadyWarned = {};
function warningOnce(key, cond, message) {
    if (!cond && !alreadyWarned[key]) alreadyWarned[key] = true;
}
/**
  Webpack + React 17 fails to compile on any of the following because webpack
  complains that `startTransition` doesn't exist in `React`:
  * import { startTransition } from "react"
  * import * as React from from "react";
    "startTransition" in React ? React.startTransition(() => setState()) : setState()
  * import * as React from from "react";
    "startTransition" in React ? React["startTransition"](() => setState()) : setState()

  Moving it to a constant such as the following solves the Webpack/React 17 issue:
  * import * as React from from "react";
    const START_TRANSITION = "startTransition";
    START_TRANSITION in React ? React[START_TRANSITION](() => setState()) : setState()

  However, that introduces webpack/terser minification issues in production builds
  in React 18 where minification/obfuscation ends up removing the call of
  React.startTransition entirely from the first half of the ternary.  Grabbing
  this exported reference once up front resolves that issue.

  See https://github.com/remix-run/react-router/issues/10579
*/ const START_TRANSITION = "startTransition";
const startTransitionImpl = /*#__PURE__*/ (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache || (react__WEBPACK_IMPORTED_MODULE_0___namespace_cache = __webpack_require__.t(react__WEBPACK_IMPORTED_MODULE_0__, 2)))[START_TRANSITION];
/**
 * Given a Remix Router instance, render the appropriate UI
 */ function RouterProvider(_ref) {
    let { fallbackElement, router, future } = _ref;
    let [state, setStateImpl] = React.useState(router.state);
    let { v7_startTransition } = future || {};
    let setState = React.useCallback((newState)=>{
        if (v7_startTransition && startTransitionImpl) startTransitionImpl(()=>setStateImpl(newState));
        else setStateImpl(newState);
    }, [
        setStateImpl,
        v7_startTransition
    ]);
    // Need to use a layout effect here so we are subscribed early enough to
    // pick up on any render-driven redirects/navigations (useEffect/<Navigate>)
    React.useLayoutEffect(()=>router.subscribe(setState), [
        router,
        setState
    ]);
    React.useEffect(()=>{
    // Only log this once on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    let navigator = React.useMemo(()=>{
        return {
            createHref: router.createHref,
            encodeLocation: router.encodeLocation,
            go: (n)=>router.navigate(n),
            push: (to, state, opts)=>router.navigate(to, {
                    state,
                    preventScrollReset: opts == null ? void 0 : opts.preventScrollReset
                }),
            replace: (to, state, opts)=>router.navigate(to, {
                    replace: true,
                    state,
                    preventScrollReset: opts == null ? void 0 : opts.preventScrollReset
                })
        };
    }, [
        router
    ]);
    let basename = router.basename || "/";
    let dataRouterContext = React.useMemo(()=>({
            router,
            navigator,
            static: false,
            basename
        }), [
        router,
        navigator,
        basename
    ]);
    // The fragment and {null} here are important!  We need them to keep React 18's
    // useId happy when we are server-rendering since we may have a <script> here
    // containing the hydrated server-side staticContext (from StaticRouterProvider).
    // useId relies on the component tree structure to generate deterministic id's
    // so we need to ensure it remains the same on the client even though
    // we don't need the <script> tag
    return /*#__PURE__*/ React.createElement(React.Fragment, null, /*#__PURE__*/ React.createElement(DataRouterContext.Provider, {
        value: dataRouterContext
    }, /*#__PURE__*/ React.createElement(DataRouterStateContext.Provider, {
        value: state
    }, /*#__PURE__*/ React.createElement(Router, {
        basename: basename,
        location: state.location,
        navigationType: state.historyAction,
        navigator: navigator,
        future: {
            v7_relativeSplatPath: router.future.v7_relativeSplatPath
        }
    }, state.initialized || router.future.v7_partialHydration ? /*#__PURE__*/ React.createElement(DataRoutes, {
        routes: router.routes,
        future: router.future,
        state: state
    }) : fallbackElement))), null);
}
function DataRoutes(_ref2) {
    let { routes, future, state } = _ref2;
    return useRoutesImpl(routes, undefined, state, future);
}
/**
 * A `<Router>` that stores all entries in memory.
 *
 * @see https://reactrouter.com/router-components/memory-router
 */ function MemoryRouter(_ref3) {
    let { basename, children, initialEntries, initialIndex, future } = _ref3;
    let historyRef = React.useRef();
    if (historyRef.current == null) historyRef.current = createMemoryHistory({
        initialEntries,
        initialIndex,
        v5Compat: true
    });
    let history = historyRef.current;
    let [state, setStateImpl] = React.useState({
        action: history.action,
        location: history.location
    });
    let { v7_startTransition } = future || {};
    let setState = React.useCallback((newState)=>{
        v7_startTransition && startTransitionImpl ? startTransitionImpl(()=>setStateImpl(newState)) : setStateImpl(newState);
    }, [
        setStateImpl,
        v7_startTransition
    ]);
    React.useLayoutEffect(()=>history.listen(setState), [
        history,
        setState
    ]);
    return /*#__PURE__*/ React.createElement(Router, {
        basename: basename,
        children: children,
        location: state.location,
        navigationType: state.action,
        navigator: history,
        future: future
    });
}
/**
 * Changes the current location.
 *
 * Note: This API is mostly useful in React.Component subclasses that are not
 * able to use hooks. In functional components, we recommend you use the
 * `useNavigate` hook instead.
 *
 * @see https://reactrouter.com/components/navigate
 */ function Navigate(_ref4) {
    let { to, replace, state, relative } = _ref4;
    !useInRouterContext() && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    let { future, static: isStatic } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(NavigationContext);
    let { matches } = react__WEBPACK_IMPORTED_MODULE_0__.useContext(RouteContext);
    let { pathname: locationPathname } = useLocation();
    let navigate = useNavigate();
    // Resolve the path outside of the effect so that when effects run twice in
    // StrictMode they navigate to the same place
    let path = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .resolveTo */.pC)(to, (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_getResolveToMatches */.cm)(matches, future.v7_relativeSplatPath), locationPathname, relative === "path");
    let jsonPath = JSON.stringify(path);
    react__WEBPACK_IMPORTED_MODULE_0__.useEffect(()=>navigate(JSON.parse(jsonPath), {
            replace,
            state,
            relative
        }), [
        navigate,
        jsonPath,
        relative,
        replace,
        state
    ]);
    return null;
}
/**
 * Renders the child route's element, if there is one.
 *
 * @see https://reactrouter.com/components/outlet
 */ function Outlet(props) {
    return useOutlet(props.context);
}
/**
 * Declares an element that should be rendered at a certain URL path.
 *
 * @see https://reactrouter.com/components/route
 */ function Route(_props) {
    UNSAFE_invariant(false);
}
/**
 * Provides location context for the rest of the app.
 *
 * Note: You usually won't render a `<Router>` directly. Instead, you'll render a
 * router that is more specific to your environment such as a `<BrowserRouter>`
 * in web browsers or a `<StaticRouter>` for server rendering.
 *
 * @see https://reactrouter.com/router-components/router
 */ function Router(_ref5) {
    let { basename: basenameProp = "/", children = null, location: locationProp, navigationType = _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .Action.Pop */.aU.Pop, navigator, static: staticProp = false, future } = _ref5;
    !!useInRouterContext() && (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .UNSAFE_invariant */.J0)(false);
    // Preserve trailing slashes on basename, so we can let the user control
    // the enforcement of trailing slashes throughout the app
    let basename = basenameProp.replace(/^\/*/, "/");
    let navigationContext = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>({
            basename,
            navigator,
            static: staticProp,
            future: _extends({
                v7_relativeSplatPath: false
            }, future)
        }), [
        basename,
        future,
        navigator,
        staticProp
    ]);
    if (typeof locationProp === "string") locationProp = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .parsePath */.cP)(locationProp);
    let { pathname = "/", search = "", hash = "", state = null, key = "default" } = locationProp;
    let locationContext = react__WEBPACK_IMPORTED_MODULE_0__.useMemo(()=>{
        let trailingPathname = (0, _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .stripBasename */.Zn)(pathname, basename);
        if (trailingPathname == null) return null;
        return {
            location: {
                pathname: trailingPathname,
                search,
                hash,
                state,
                key
            },
            navigationType
        };
    }, [
        basename,
        pathname,
        search,
        hash,
        state,
        key,
        navigationType
    ]);
    if (locationContext == null) return null;
    return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(NavigationContext.Provider, {
        value: navigationContext
    }, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(LocationContext.Provider, {
        children: children,
        value: locationContext
    }));
}
/**
 * A container for a nested tree of `<Route>` elements that renders the branch
 * that best matches the current location.
 *
 * @see https://reactrouter.com/components/routes
 */ function Routes(_ref6) {
    let { children, location } = _ref6;
    return useRoutes(createRoutesFromChildren(children), location);
}
/**
 * Component to use for rendering lazily loaded data from returning defer()
 * in a loader function
 */ function Await(_ref7) {
    let { children, errorElement, resolve } = _ref7;
    return /*#__PURE__*/ React.createElement(AwaitErrorBoundary, {
        resolve: resolve,
        errorElement: errorElement
    }, /*#__PURE__*/ React.createElement(ResolveAwait, null, children));
}
var AwaitRenderStatus = /*#__PURE__*/ function(AwaitRenderStatus) {
    AwaitRenderStatus[AwaitRenderStatus["pending"] = 0] = "pending";
    AwaitRenderStatus[AwaitRenderStatus["success"] = 1] = "success";
    AwaitRenderStatus[AwaitRenderStatus["error"] = 2] = "error";
    return AwaitRenderStatus;
}(AwaitRenderStatus || {});
const neverSettledPromise = new Promise(()=>{});
class AwaitErrorBoundary extends react__WEBPACK_IMPORTED_MODULE_0__.Component {
    constructor(props){
        super(props);
        this.state = {
            error: null
        };
    }
    static getDerivedStateFromError(error) {
        return {
            error
        };
    }
    componentDidCatch(error, errorInfo) {
        console.error("<Await> caught the following error during render", error, errorInfo);
    }
    render() {
        let { children, errorElement, resolve } = this.props;
        let promise = null;
        let status = AwaitRenderStatus.pending;
        if (!(resolve instanceof Promise)) {
            // Didn't get a promise - provide as a resolved promise
            status = AwaitRenderStatus.success;
            promise = Promise.resolve();
            Object.defineProperty(promise, "_tracked", {
                get: ()=>true
            });
            Object.defineProperty(promise, "_data", {
                get: ()=>resolve
            });
        } else if (this.state.error) {
            // Caught a render error, provide it as a rejected promise
            status = AwaitRenderStatus.error;
            let renderError = this.state.error;
            promise = Promise.reject().catch(()=>{}); // Avoid unhandled rejection warnings
            Object.defineProperty(promise, "_tracked", {
                get: ()=>true
            });
            Object.defineProperty(promise, "_error", {
                get: ()=>renderError
            });
        } else if (resolve._tracked) {
            // Already tracked promise - check contents
            promise = resolve;
            status = "_error" in promise ? AwaitRenderStatus.error : "_data" in promise ? AwaitRenderStatus.success : AwaitRenderStatus.pending;
        } else {
            // Raw (untracked) promise - track it
            status = AwaitRenderStatus.pending;
            Object.defineProperty(resolve, "_tracked", {
                get: ()=>true
            });
            promise = resolve.then((data)=>Object.defineProperty(resolve, "_data", {
                    get: ()=>data
                }), (error)=>Object.defineProperty(resolve, "_error", {
                    get: ()=>error
                }));
        }
        if (status === AwaitRenderStatus.error && promise._error instanceof _remix_run_router__WEBPACK_IMPORTED_MODULE_1__/* .AbortedDeferredError */.X3) // Freeze the UI by throwing a never resolved promise
        throw neverSettledPromise;
        if (status === AwaitRenderStatus.error && !errorElement) // No errorElement, throw to the nearest route-level error boundary
        throw promise._error;
        if (status === AwaitRenderStatus.error) // Render via our errorElement
        return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(AwaitContext.Provider, {
            value: promise,
            children: errorElement
        });
        if (status === AwaitRenderStatus.success) // Render children with resolved value
        return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(AwaitContext.Provider, {
            value: promise,
            children: children
        });
        // Throw to the suspense boundary
        throw promise;
    }
}
/**
 * @private
 * Indirection to leverage useAsyncValue for a render-prop API on `<Await>`
 */ function ResolveAwait(_ref8) {
    let { children } = _ref8;
    let data = useAsyncValue();
    let toRender = typeof children === "function" ? children(data) : children;
    return /*#__PURE__*/ React.createElement(React.Fragment, null, toRender);
}
///////////////////////////////////////////////////////////////////////////////
// UTILS
///////////////////////////////////////////////////////////////////////////////
/**
 * Creates a route config from a React "children" object, which is usually
 * either a `<Route>` element or an array of them. Used internally by
 * `<Routes>` to create a route config from its children.
 *
 * @see https://reactrouter.com/utils/create-routes-from-children
 */ function createRoutesFromChildren(children, parentPath) {
    if (parentPath === void 0) parentPath = [];
    let routes = [];
    React.Children.forEach(children, (element, index)=>{
        if (!/*#__PURE__*/ React.isValidElement(element)) // Ignore non-elements. This allows people to more easily inline
        // conditionals in their route config.
        return;
        let treePath = [
            ...parentPath,
            index
        ];
        if (element.type === React.Fragment) {
            // Transparently support React.Fragment and its children.
            routes.push.apply(routes, createRoutesFromChildren(element.props.children, treePath));
            return;
        }
        !(element.type === Route) && UNSAFE_invariant(false);
        !(!element.props.index || !element.props.children) && UNSAFE_invariant(false);
        let route = {
            id: element.props.id || treePath.join("-"),
            caseSensitive: element.props.caseSensitive,
            element: element.props.element,
            Component: element.props.Component,
            index: element.props.index,
            path: element.props.path,
            loader: element.props.loader,
            action: element.props.action,
            errorElement: element.props.errorElement,
            ErrorBoundary: element.props.ErrorBoundary,
            hasErrorBoundary: element.props.ErrorBoundary != null || element.props.errorElement != null,
            shouldRevalidate: element.props.shouldRevalidate,
            handle: element.props.handle,
            lazy: element.props.lazy
        };
        if (element.props.children) route.children = createRoutesFromChildren(element.props.children, treePath);
        routes.push(route);
    });
    return routes;
}
/**
 * Renders the result of `matchRoutes()` into a React element.
 */ function renderMatches(matches) {
    return _renderMatches(matches);
}
function mapRouteProperties(route) {
    let updates = {
        // Note: this check also occurs in createRoutesFromChildren so update
        // there if you change this -- please and thank you!
        hasErrorBoundary: route.ErrorBoundary != null || route.errorElement != null
    };
    if (route.Component) Object.assign(updates, {
        element: /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(route.Component),
        Component: undefined
    });
    if (route.HydrateFallback) Object.assign(updates, {
        hydrateFallbackElement: /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(route.HydrateFallback),
        HydrateFallback: undefined
    });
    if (route.ErrorBoundary) Object.assign(updates, {
        errorElement: /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(route.ErrorBoundary),
        ErrorBoundary: undefined
    });
    return updates;
}
function createMemoryRouter(routes, opts) {
    return createRouter({
        basename: opts == null ? void 0 : opts.basename,
        future: _extends({}, opts == null ? void 0 : opts.future, {
            v7_prependBasename: true
        }),
        history: createMemoryHistory({
            initialEntries: opts == null ? void 0 : opts.initialEntries,
            initialIndex: opts == null ? void 0 : opts.initialIndex
        }),
        hydrationData: opts == null ? void 0 : opts.hydrationData,
        routes,
        mapRouteProperties,
        unstable_dataStrategy: opts == null ? void 0 : opts.unstable_dataStrategy,
        unstable_patchRoutesOnNavigation: opts == null ? void 0 : opts.unstable_patchRoutesOnNavigation
    }).initialize();
}
 //# sourceMappingURL=index.js.map
}),
"426": (function (__unused_webpack_module, exports, __webpack_require__) {
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 'use strict';
var f = __webpack_require__("378"), k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p = {
    key: !0,
    ref: !0,
    __self: !0,
    __source: !0
};
function q(c, a, g) {
    var b, d = {}, e = null, h = null;
    void 0 !== g && (e = "" + g);
    void 0 !== a.key && (e = "" + a.key);
    void 0 !== a.ref && (h = a.ref);
    for(b in a)m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
    if (c && c.defaultProps) for(b in a = c.defaultProps, a)void 0 === d[b] && (d[b] = a[b]);
    return {
        $$typeof: k,
        type: c,
        key: e,
        ref: h,
        props: d,
        _owner: n.current
    };
}
exports.Fragment = l;
exports.jsx = q;
exports.jsxs = q;
}),
"535": (function (__unused_webpack_module, exports) {
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 'use strict';
var l = Symbol.for("react.element"), n = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), q = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t = Symbol.for("react.provider"), u = Symbol.for("react.context"), v = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z = Symbol.iterator;
function A(a) {
    if (null === a || "object" !== typeof a) return null;
    a = z && a[z] || a["@@iterator"];
    return "function" === typeof a ? a : null;
}
var B = {
    isMounted: function() {
        return !1;
    },
    enqueueForceUpdate: function() {},
    enqueueReplaceState: function() {},
    enqueueSetState: function() {}
}, C = Object.assign, D = {};
function E(a, b, e) {
    this.props = a;
    this.context = b;
    this.refs = D;
    this.updater = e || B;
}
E.prototype.isReactComponent = {};
E.prototype.setState = function(a, b) {
    if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, a, b, "setState");
};
E.prototype.forceUpdate = function(a) {
    this.updater.enqueueForceUpdate(this, a, "forceUpdate");
};
function F() {}
F.prototype = E.prototype;
function G(a, b, e) {
    this.props = a;
    this.context = b;
    this.refs = D;
    this.updater = e || B;
}
var H = G.prototype = new F;
H.constructor = G;
C(H, E.prototype);
H.isPureReactComponent = !0;
var I = Array.isArray, J = Object.prototype.hasOwnProperty, K = {
    current: null
}, L = {
    key: !0,
    ref: !0,
    __self: !0,
    __source: !0
};
function M(a, b, e) {
    var d, c = {}, k = null, h = null;
    if (null != b) for(d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b)J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
    var g = arguments.length - 2;
    if (1 === g) c.children = e;
    else if (1 < g) {
        for(var f = Array(g), m = 0; m < g; m++)f[m] = arguments[m + 2];
        c.children = f;
    }
    if (a && a.defaultProps) for(d in g = a.defaultProps, g)void 0 === c[d] && (c[d] = g[d]);
    return {
        $$typeof: l,
        type: a,
        key: k,
        ref: h,
        props: c,
        _owner: K.current
    };
}
function N(a, b) {
    return {
        $$typeof: l,
        type: a.type,
        key: b,
        ref: a.ref,
        props: a.props,
        _owner: a._owner
    };
}
function O(a) {
    return "object" === typeof a && null !== a && a.$$typeof === l;
}
function escape(a) {
    var b = {
        "=": "=0",
        ":": "=2"
    };
    return "$" + a.replace(/[=:]/g, function(a) {
        return b[a];
    });
}
var P = /\/+/g;
function Q(a, b) {
    return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
}
function R(a, b, e, d, c) {
    var k = typeof a;
    if ("undefined" === k || "boolean" === k) a = null;
    var h = !1;
    if (null === a) h = !0;
    else switch(k){
        case "string":
        case "number":
            h = !0;
            break;
        case "object":
            switch(a.$$typeof){
                case l:
                case n:
                    h = !0;
            }
    }
    if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a) {
        return a;
    })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
    h = 0;
    d = "" === d ? "." : d + ":";
    if (I(a)) for(var g = 0; g < a.length; g++){
        k = a[g];
        var f = d + Q(k, g);
        h += R(k, b, e, f, c);
    }
    else if (f = A(a), "function" === typeof f) for(a = f.call(a), g = 0; !(k = a.next()).done;)k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
    else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
    return h;
}
function S(a, b, e) {
    if (null == a) return a;
    var d = [], c = 0;
    R(a, d, "", "", function(a) {
        return b.call(e, a, c++);
    });
    return d;
}
function T(a) {
    if (-1 === a._status) {
        var b = a._result;
        b = b();
        b.then(function(b) {
            if (0 === a._status || -1 === a._status) a._status = 1, a._result = b;
        }, function(b) {
            if (0 === a._status || -1 === a._status) a._status = 2, a._result = b;
        });
        -1 === a._status && (a._status = 0, a._result = b);
    }
    if (1 === a._status) return a._result.default;
    throw a._result;
}
var U = {
    current: null
}, V = {
    transition: null
}, W = {
    ReactCurrentDispatcher: U,
    ReactCurrentBatchConfig: V,
    ReactCurrentOwner: K
};
function X() {
    throw Error("act(...) is not supported in production builds of React.");
}
exports.Children = {
    map: S,
    forEach: function(a, b, e) {
        S(a, function() {
            b.apply(this, arguments);
        }, e);
    },
    count: function(a) {
        var b = 0;
        S(a, function() {
            b++;
        });
        return b;
    },
    toArray: function(a) {
        return S(a, function(a) {
            return a;
        }) || [];
    },
    only: function(a) {
        if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
        return a;
    }
};
exports.Component = E;
exports.Fragment = p;
exports.Profiler = r;
exports.PureComponent = G;
exports.StrictMode = q;
exports.Suspense = w;
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
exports.act = X;
exports.cloneElement = function(a, b, e) {
    if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
    var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
    if (null != b) {
        void 0 !== b.ref && (k = b.ref, h = K.current);
        void 0 !== b.key && (c = "" + b.key);
        if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
        for(f in b)J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
    }
    var f = arguments.length - 2;
    if (1 === f) d.children = e;
    else if (1 < f) {
        g = Array(f);
        for(var m = 0; m < f; m++)g[m] = arguments[m + 2];
        d.children = g;
    }
    return {
        $$typeof: l,
        type: a.type,
        key: c,
        ref: k,
        props: d,
        _owner: h
    };
};
exports.createContext = function(a) {
    a = {
        $$typeof: u,
        _currentValue: a,
        _currentValue2: a,
        _threadCount: 0,
        Provider: null,
        Consumer: null,
        _defaultValue: null,
        _globalName: null
    };
    a.Provider = {
        $$typeof: t,
        _context: a
    };
    return a.Consumer = a;
};
exports.createElement = M;
exports.createFactory = function(a) {
    var b = M.bind(null, a);
    b.type = a;
    return b;
};
exports.createRef = function() {
    return {
        current: null
    };
};
exports.forwardRef = function(a) {
    return {
        $$typeof: v,
        render: a
    };
};
exports.isValidElement = O;
exports.lazy = function(a) {
    return {
        $$typeof: y,
        _payload: {
            _status: -1,
            _result: a
        },
        _init: T
    };
};
exports.memo = function(a, b) {
    return {
        $$typeof: x,
        type: a,
        compare: void 0 === b ? null : b
    };
};
exports.startTransition = function(a) {
    var b = V.transition;
    V.transition = {};
    try {
        a();
    } finally{
        V.transition = b;
    }
};
exports.unstable_act = X;
exports.useCallback = function(a, b) {
    return U.current.useCallback(a, b);
};
exports.useContext = function(a) {
    return U.current.useContext(a);
};
exports.useDebugValue = function() {};
exports.useDeferredValue = function(a) {
    return U.current.useDeferredValue(a);
};
exports.useEffect = function(a, b) {
    return U.current.useEffect(a, b);
};
exports.useId = function() {
    return U.current.useId();
};
exports.useImperativeHandle = function(a, b, e) {
    return U.current.useImperativeHandle(a, b, e);
};
exports.useInsertionEffect = function(a, b) {
    return U.current.useInsertionEffect(a, b);
};
exports.useLayoutEffect = function(a, b) {
    return U.current.useLayoutEffect(a, b);
};
exports.useMemo = function(a, b) {
    return U.current.useMemo(a, b);
};
exports.useReducer = function(a, b, e) {
    return U.current.useReducer(a, b, e);
};
exports.useRef = function(a) {
    return U.current.useRef(a);
};
exports.useState = function(a) {
    return U.current.useState(a);
};
exports.useSyncExternalStore = function(a, b, e) {
    return U.current.useSyncExternalStore(a, b, e);
};
exports.useTransition = function() {
    return U.current.useTransition();
};
exports.version = "18.3.1";
}),
"378": (function (module, __unused_webpack_exports, __webpack_require__) {
'use strict';
module.exports = __webpack_require__("535");
}),
"246": (function (module, __unused_webpack_exports, __webpack_require__) {
'use strict';
module.exports = __webpack_require__("426");
}),
"323": (function (__unused_webpack_module, exports) {
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 'use strict';
function f(a, b) {
    var c = a.length;
    a.push(b);
    a: for(; 0 < c;){
        var d = c - 1 >>> 1, e = a[d];
        if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
        else break a;
    }
}
function h(a) {
    return 0 === a.length ? null : a[0];
}
function k(a) {
    if (0 === a.length) return null;
    var b = a[0], c = a.pop();
    if (c !== b) {
        a[0] = c;
        a: for(var d = 0, e = a.length, w = e >>> 1; d < w;){
            var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
            if (0 > g(C, c)) n < e && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
            else if (n < e && 0 > g(x, c)) a[d] = x, a[n] = c, d = n;
            else break a;
        }
    }
    return b;
}
function g(a, b) {
    var c = a.sortIndex - b.sortIndex;
    return 0 !== c ? c : a.id - b.id;
}
if ("object" === typeof performance && "function" === typeof performance.now) {
    var l = performance;
    exports.unstable_now = function() {
        return l.now();
    };
} else {
    var p = Date, q = p.now();
    exports.unstable_now = function() {
        return p.now() - q;
    };
}
var r = [], t = [], u = 1, v = null, y = 3, z = !1, A = !1, B = !1, D = "function" === typeof setTimeout ? setTimeout : null, E = "function" === typeof clearTimeout ? clearTimeout : null, F = "undefined" !== typeof setImmediate ? setImmediate : null;
"undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
function G(a) {
    for(var b = h(t); null !== b;){
        if (null === b.callback) k(t);
        else if (b.startTime <= a) k(t), b.sortIndex = b.expirationTime, f(r, b);
        else break;
        b = h(t);
    }
}
function H(a) {
    B = !1;
    G(a);
    if (!A) {
        if (null !== h(r)) A = !0, I(J);
        else {
            var b = h(t);
            null !== b && K(H, b.startTime - a);
        }
    }
}
function J(a, b) {
    A = !1;
    B && (B = !1, E(L), L = -1);
    z = !0;
    var c = y;
    try {
        G(b);
        for(v = h(r); null !== v && (!(v.expirationTime > b) || a && !M());){
            var d = v.callback;
            if ("function" === typeof d) {
                v.callback = null;
                y = v.priorityLevel;
                var e = d(v.expirationTime <= b);
                b = exports.unstable_now();
                "function" === typeof e ? v.callback = e : v === h(r) && k(r);
                G(b);
            } else k(r);
            v = h(r);
        }
        if (null !== v) var w = !0;
        else {
            var m = h(t);
            null !== m && K(H, m.startTime - b);
            w = !1;
        }
        return w;
    } finally{
        v = null, y = c, z = !1;
    }
}
var N = !1, O = null, L = -1, P = 5, Q = -1;
function M() {
    return exports.unstable_now() - Q < P ? !1 : !0;
}
function R() {
    if (null !== O) {
        var a = exports.unstable_now();
        Q = a;
        var b = !0;
        try {
            b = O(!0, a);
        } finally{
            b ? S() : (N = !1, O = null);
        }
    } else N = !1;
}
var S;
if ("function" === typeof F) S = function() {
    F(R);
};
else if ("undefined" !== typeof MessageChannel) {
    var T = new MessageChannel, U = T.port2;
    T.port1.onmessage = R;
    S = function() {
        U.postMessage(null);
    };
} else S = function() {
    D(R, 0);
};
function I(a) {
    O = a;
    N || (N = !0, S());
}
function K(a, b) {
    L = D(function() {
        a(exports.unstable_now());
    }, b);
}
exports.unstable_IdlePriority = 5;
exports.unstable_ImmediatePriority = 1;
exports.unstable_LowPriority = 4;
exports.unstable_NormalPriority = 3;
exports.unstable_Profiling = null;
exports.unstable_UserBlockingPriority = 2;
exports.unstable_cancelCallback = function(a) {
    a.callback = null;
};
exports.unstable_continueExecution = function() {
    A || z || (A = !0, I(J));
};
exports.unstable_forceFrameRate = function(a) {
    0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1E3 / a) : 5;
};
exports.unstable_getCurrentPriorityLevel = function() {
    return y;
};
exports.unstable_getFirstCallbackNode = function() {
    return h(r);
};
exports.unstable_next = function(a) {
    switch(y){
        case 1:
        case 2:
        case 3:
            var b = 3;
            break;
        default:
            b = y;
    }
    var c = y;
    y = b;
    try {
        return a();
    } finally{
        y = c;
    }
};
exports.unstable_pauseExecution = function() {};
exports.unstable_requestPaint = function() {};
exports.unstable_runWithPriority = function(a, b) {
    switch(a){
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
            break;
        default:
            a = 3;
    }
    var c = y;
    y = a;
    try {
        return b();
    } finally{
        y = c;
    }
};
exports.unstable_scheduleCallback = function(a, b, c) {
    var d = exports.unstable_now();
    "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
    switch(a){
        case 1:
            var e = -1;
            break;
        case 2:
            e = 250;
            break;
        case 5:
            e = 1073741823;
            break;
        case 4:
            e = 1E4;
            break;
        default:
            e = 5E3;
    }
    e = c + e;
    a = {
        id: u++,
        callback: b,
        priorityLevel: a,
        startTime: c,
        expirationTime: e,
        sortIndex: -1
    };
    c > d ? (a.sortIndex = c, f(t, a), null === h(r) && a === h(t) && (B ? (E(L), L = -1) : B = !0, K(H, c - d))) : (a.sortIndex = e, f(r, a), A || z || (A = !0, I(J)));
    return a;
};
exports.unstable_shouldYield = M;
exports.unstable_wrapCallback = function(a) {
    var b = y;
    return function() {
        var c = y;
        y = b;
        try {
            return a.apply(this, arguments);
        } finally{
            y = c;
        }
    };
};
}),
"102": (function (module, __unused_webpack_exports, __webpack_require__) {
'use strict';
module.exports = __webpack_require__("323");
}),
"47": (function (__unused_webpack_module, exports, __webpack_require__) {
/**
 * @license React
 * use-sync-external-store-shim.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ 'use strict';
var e = __webpack_require__("378");
function h(a, b) {
    return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
}
var k = "function" === typeof Object.is ? Object.is : h, l = e.useState, m = e.useEffect, n = e.useLayoutEffect, p = e.useDebugValue;
function q(a, b) {
    var d = b(), f = l({
        inst: {
            value: d,
            getSnapshot: b
        }
    }), c = f[0].inst, g = f[1];
    n(function() {
        c.value = d;
        c.getSnapshot = b;
        r(c) && g({
            inst: c
        });
    }, [
        a,
        d,
        b
    ]);
    m(function() {
        r(c) && g({
            inst: c
        });
        return a(function() {
            r(c) && g({
                inst: c
            });
        });
    }, [
        a
    ]);
    p(d);
    return d;
}
function r(a) {
    var b = a.getSnapshot;
    a = a.value;
    try {
        var d = b();
        return !k(a, d);
    } catch (f) {
        return !0;
    }
}
function t(a, b) {
    return b();
}
var u = "undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement ? t : q;
exports.useSyncExternalStore = void 0 !== e.useSyncExternalStore ? e.useSyncExternalStore : u;
}),
"644": (function (module, __unused_webpack_exports, __webpack_require__) {
'use strict';
module.exports = __webpack_require__("47");
}),

}]);