import type { Request, Response, NextFunction, Application } from 'express';
import { distance as levenshteinDistance } from 'fastest-levenshtein';

export interface MiddlewareOptions {
	blacklist?: string[];
	customRedirects?: Record<string, string>;
	suggestOnly?: boolean;
	threshold?: number;
	whitelist?: string[];
}

const collectRoutes = (stack: any[], routes: string[] = []) => {
	for (const layer of stack) {
		if (layer.route && layer.route.path !== '/') {
			routes.push(layer.route.path);
		} else if (layer.handle?.stack) {
			collectRoutes(layer.handle.stack, routes);
		}
	}

	return routes;
};

const getClosestRoute = (path: string, routes: string[], threshold = 2) => {
	let minDistance = threshold;
	let closestRoute = null;

	for (const route of routes) {
		const distance = levenshteinDistance(path, route);
		if (distance === 0) {
			return route;
		}

		if (distance <= minDistance) {
			minDistance = distance;
			closestRoute = route;
		}
	}

	return closestRoute;
};

const matchAgainstTemplates = (path: string, templates: string[], threshold?: number) => {
	const inputSegments = path.split('/').filter(Boolean);

	for (const template of templates) {
		const templateSegments = template.split('/').filter(Boolean);

		if (inputSegments.length !== templateSegments.length) {
			continue;
		}

		const correctedSegments: string[] = [];
		let isMatch = true;

		for (const [index, inputSegment] of inputSegments.entries()) {
			const templateSegment = templateSegments[index];

			if (templateSegment.startsWith(':')) {
				correctedSegments.push(inputSegment);
				continue;
			}

			const correctedSegment = getClosestRoute(inputSegment, [templateSegment], threshold) ?? inputSegment;

			if (correctedSegment !== templateSegment) {
				isMatch = false;
				break;
			}

			correctedSegments.push(correctedSegment);
		}

		if (isMatch) {
			return '/' + correctedSegments.join('/');
		}
	}

	return null;
};

const routeCorrector = (app: Application, options: MiddlewareOptions = {}) => {
	const validRoutes = collectRoutes(app._router.stack);

	return (req: Request, res: Response, next: NextFunction) => {
		console.log({ path: req.path });
		if (options.whitelist && !options.whitelist.includes(req.path)) {
			next();
			return;
		}

		if (options.blacklist && options.blacklist.includes(req.path)) {
			next();
			return;
		}

		let closestRoute = options.customRedirects ? options.customRedirects[req.path] : null;
		if (!closestRoute) {
			closestRoute = matchAgainstTemplates(req.path, validRoutes, options.threshold);
		}

		if (closestRoute) {
			const queryString = Object.keys(req.query).length ? `?${new URLSearchParams(req.query as any)}` : '';
			console.log({ queryString, q: req.query });

			if (options.suggestOnly) {
				res.locals.suggestedRoute = closestRoute + queryString;
				next();
			} else {
				res.redirect(301, closestRoute + queryString);
			}

			return;
		}

		next();
	};
};

// eslint-disable-next-line import/no-default-export
export default routeCorrector;
