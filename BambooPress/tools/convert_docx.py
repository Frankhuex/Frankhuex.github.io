"""Convert the supplied edition: python3 convert_docx.py input.docx output.js."""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

AUTHORS = dict(Lh='BCE', Wk='Wkz', Cs='真爱困', Lt='Lth', Gh='Small Pot', Hh='Frank', Wt='Wtc')
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

def convert(source):
    with zipfile.ZipFile(source) as archive:
        root = ET.fromstring(archive.read('word/document.xml'))
    paragraphs = []
    for paragraph in root.findall('./w:body/w:p', NS):
        text = ''.join(node.text or '' if node.tag.endswith('}t') else '\n' if node.tag.endswith('}br') else '\t' if node.tag.endswith('}tab') else '' for node in paragraph.iter() if node.tag in {f"{{{NS['w']}}}t", f"{{{NS['w']}}}br", f"{{{NS['w']}}}tab"})
        paragraphs.append(text)
    excerpts = {}
    for index, text in enumerate(paragraphs[:-1]):
        match = re.match(r'^(0[1-7])\s+……', text)
        if match:
            excerpts[match.group(1)] = paragraphs[index + 1].strip()
    chapters = []
    chapter = None
    part = None
    marker = re.compile(r'Lh|Wk(?!z)|Cs|Lt(?!h)|Gh|Hh|Wt(?!c)')
    pending = []
    marker_count = 0
    for text in paragraphs:
        title = text.strip()
        if chapter is None and title != '前言':
            continue
        if title in ['前言', '01', '02', '03', '04', '05', '06', '07', '尾声', '后记']:
            previous_author = part['author'] if part else None
            chapter = {'id': f'c{len(chapters)}', 'title': title, 'excerpt': excerpts.get(title, ''), 'parts': [], 'paragraphs': []}
            chapters.append(chapter)
            part = None
            if previous_author and title not in ['前言', '后记']:
                part = {'id': chapter['id'] + '-continued', 'author': previous_author}
                chapter['parts'].append(part)
            continue
        if chapter is None or not title:
            continue
        if chapter['title'] in ['前言', '后记']:
            signature = re.search(r'(BCE|Small\s+Pot|Frank|Wkz|Lth|真爱困|Wtc)\s*$', text)
            if signature:
                body = text[:signature.start()].strip()
                if body:
                    pending.append(body)
                name = re.sub(r'\s+', ' ', signature.group(1))
                author = next(key for key, value in AUTHORS.items() if value == name)
                part = {'id': f"{chapter['id']}-s{len(chapter['parts'])}", 'author': author}
                chapter['parts'].append(part)
                for body in pending:
                    chapter['paragraphs'].append([{'text': body, 'part': part['id']}])
                pending = []
            else:
                pending.append(text)
            continue
        segments = []
        cursor = 0
        for match in marker.finditer(text):
            if match.start() > cursor:
                segments.append({'text': text[cursor:match.start()], 'part': part['id'] if part else None})
            part = {'id': f"{chapter['id']}-s{len(chapter['parts'])}", 'author': match.group()}
            chapter['parts'].append(part)
            marker_count += 1
            cursor = match.end()
        if cursor < len(text):
            segments.append({'text': text[cursor:], 'part': part['id'] if part else None})
        if any(segment['text'].strip() for segment in segments):
            assert part, text
            assert ''.join(s['text'] for s in segments) == marker.sub('', text)
            chapter['paragraphs'].append(segments)
    for item in chapters:
        for paragraph in item['paragraphs']:
            if len(paragraph) > 1 and re.fullmatch(r'[\s“‘「『（(]*', paragraph[0]['text']):
                paragraph[1]['text'] = paragraph[0]['text'] + paragraph[1]['text']
                paragraph.pop(0)
        item['paragraphs'] = [[segment for segment in paragraph if segment['text'].strip()] for paragraph in item['paragraphs']]
        used = {segment['part'] for paragraph in item['paragraphs'] for segment in paragraph if segment['text'].strip()}
        item['parts'] = [part for part in item['parts'] if part['id'] in used]
    for item in chapters:
        if item['title'] == '尾声':
            item['title'] = '08　尾声'
    assert not pending
    assert len(chapters) == 10, [c["title"] for c in chapters]
    assert marker_count == 57, marker_count
    assert len(chapters[-1]['parts']) == 7
    return {'id': 'wuzhiyin', 'title': '无只因生还', 'version': '2.0.5', 'authors': AUTHORS, 'chapters': chapters}

if __name__ == '__main__':
    novel = convert(sys.argv[1])
    Path(sys.argv[2]).write_text('export const novel = ' + json.dumps(novel, ensure_ascii=False, indent=2) + ';\n')
    print('Validated 10 sections, 57 relay markers and 7 afterwords.')
