type Point = { x: number; y: number };

function to_path(points: Point[]): string {
	if (points.length === 0) return '';
	return (
		points
			.map(
				(point, i) =>
					`${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
			)
			.join(' ') + ' Z'
	);
}

function signed_area(points: Point[]): number {
	let area = 0;
	for (let i = 0; i < points.length; i++) {
		const a = points[i]!;
		const b = points[(i + 1) % points.length]!;
		area += a.x * b.y - b.x * a.y;
	}
	return area / 2;
}

function with_winding(points: Point[], clockwise: boolean): Point[] {
	const is_clockwise = signed_area(points) > 0;
	return is_clockwise === clockwise ? points : [...points].reverse();
}

export function polygon_points(
	center: Point,
	radius: number,
	sides: number,
	rotation: number,
): Point[] {
	const count = Math.max(3, Math.round(sides));
	return Array.from({ length: count }, (_, i) => {
		const angle = rotation + (i / count) * Math.PI * 2;
		return {
			x: center.x + Math.cos(angle) * radius,
			y: center.y + Math.sin(angle) * radius,
		};
	});
}

export function polygon_path(
	center: Point,
	edge: Point,
	sides: number,
): string {
	const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
	const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
	return to_path(
		with_winding(polygon_points(center, radius, sides, rotation), true),
	);
}

export function star_points(
	center: Point,
	radius: number,
	points: number,
	inner_ratio: number,
	rotation: number,
): Point[] {
	const count = Math.max(3, Math.round(points));
	const inner = radius * Math.min(Math.max(inner_ratio, 0.05), 0.95);
	return Array.from({ length: count * 2 }, (_, i) => {
		const r = i % 2 === 0 ? radius : inner;
		const angle = rotation + (i / (count * 2)) * Math.PI * 2;
		return {
			x: center.x + Math.cos(angle) * r,
			y: center.y + Math.sin(angle) * r,
		};
	});
}

export function star_path(
	center: Point,
	edge: Point,
	points: number,
	inner_ratio: number,
): string {
	const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
	const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
	return to_path(
		with_winding(
			star_points(center, radius, points, inner_ratio, rotation),
			true,
		),
	);
}

function circle_points(center: Point, radius: number, segments = 96) {
	return Array.from({ length: segments }, (_, i) => {
		const angle = (i / segments) * Math.PI * 2;
		return {
			x: center.x + Math.cos(angle) * radius,
			y: center.y + Math.sin(angle) * radius,
		};
	});
}

export function ring_path(
	center: Point,
	edge: Point,
	thickness: number,
): string {
	const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
	const half = Math.max(thickness, 1) / 2;
	const outer = radius + half;
	const inner = Math.max(radius - half, 0);
	const outer_path = to_path(with_winding(circle_points(center, outer), true));
	if (inner <= 0) return outer_path;
	return (
		outer_path +
		' ' +
		to_path(with_winding(circle_points(center, inner), false))
	);
}

function spiral_arm_points(
	center: Point,
	radius: number,
	rotation: number,
	turns: number,
	width: number,
	core_ratio = 0.08,
): Point[] {
	const steps = 80;
	const left: Point[] = [];
	const right: Point[] = [];
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const r = radius * (core_ratio + (1 - core_ratio) * t);
		const angle = rotation + turns * Math.PI * 2 * t;
		const next_t = Math.min(t + 1 / steps, 1);
		const next_r = radius * (core_ratio + (1 - core_ratio) * next_t);
		const next_angle = rotation + turns * Math.PI * 2 * next_t;
		const px = center.x + Math.cos(angle) * r;
		const py = center.y + Math.sin(angle) * r;
		let dx = center.x + Math.cos(next_angle) * next_r - px;
		let dy = center.y + Math.sin(next_angle) * next_r - py;
		if (i === steps) {
			const prev_t = t - 1 / steps;
			const prev_r = radius * (core_ratio + (1 - core_ratio) * prev_t);
			const prev_angle = rotation + turns * Math.PI * 2 * prev_t;
			dx = px - (center.x + Math.cos(prev_angle) * prev_r);
			dy = py - (center.y + Math.sin(prev_angle) * prev_r);
		}
		const length = Math.hypot(dx, dy) || 1;
		const nx = -dy / length;
		const ny = dx / length;
		const w = (width / 2) * (1 - 0.75 * t) + (width / 2) * 0.25 * (1 - t);
		left.push({ x: px + nx * w, y: py + ny * w });
		right.push({ x: px - nx * w, y: py - ny * w });
	}
	return [...left, ...right.reverse()];
}

export function spiral_path(
	center: Point,
	edge: Point,
	arms: number,
	turns: number,
	width: number,
): string {
	const radius = Math.hypot(edge.x - center.x, edge.y - center.y);
	const rotation = Math.atan2(edge.y - center.y, edge.x - center.x);
	const count = Math.max(1, Math.round(arms));
	const paths: string[] = [];
	for (let i = 0; i < count; i++) {
		const arm_rotation = rotation + (i / count) * Math.PI * 2;
		paths.push(
			to_path(
				with_winding(
					spiral_arm_points(center, radius, arm_rotation, turns, width),
					true,
				),
			),
		);
	}
	paths.push(
		to_path(
			with_winding(circle_points(center, Math.max(width * 0.6, 4), 48), true),
		),
	);
	return paths.join(' ');
}
