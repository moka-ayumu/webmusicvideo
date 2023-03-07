import { open, writeFile } from 'node:fs/promises';

const file = await open('./nogit/ko.vtt');
let skipHeader = false;
let type: 'call' | 'response' = 'call';
const timelines: {
	time: number;
	duration: number;
	type: 'call' | 'response';
	content: string;
}[] = [];

let time = -1;
let duration = -1;
let reduceContent = '';

for await (const line of file.readLines()) {
	if (line.includes('-->')) {
		if (!skipHeader) skipHeader = true;
		const [start, end] = line.split(' --> ');
		time = parseTimeString(start);
		duration = parseTimeString(end) - time;
	} else if (line === '' && reduceContent !== '') {
		timelines.push({
			time,
			duration,
			type,
			content: reduceContent
		});
		reduceContent = '';
	} else if (skipHeader) {
		let isFirstLine = false;
		if (line.startsWith('M:')) {
			isFirstLine = true;
			type = 'response';
		} else if (line.startsWith('―') || line.startsWith('－') || line.startsWith('ー')) {
			isFirstLine = true;
			type = 'call';
		}
		reduceContent += isFirstLine
			? line.replace('―　', '').replace('－　', '').replace('ー　', '').replace('M:　', '')
			: line;
	}
}

await writeFile('./nogit/ko.json', JSON.stringify({ timelines }));

function parseTimeString(time: string) {
	const [hour, minute, second] = time.split(':').map(Number);
	const sumSecond = hour * 60 * 60 + minute * 60 + second;
	return Math.round(sumSecond * 1000);
}
