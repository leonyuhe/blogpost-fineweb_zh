#!/usr/bin/env python3
"""Replace translated HTML blocks and add stable heading IDs."""
import json,re
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]; SRC=ROOT/"src/index.original.html"; OUT=ROOT/"src/index.html"; WORK=ROOT/"work"
TAGS={"h2","h3","h4","h5","p","aside","li","td","th","figcaption","blockquote","summary"}
def parse_blocks(text):
    d={}; pat=re.compile(r"^<<<BLOCK ([^>\s]+)>>>[ \t]*$",re.M); ms=list(pat.finditer(text))
    for i,m in enumerate(ms):
        end=ms[i+1].start() if i+1<len(ms) else len(text)
        d[m.group(1)]=re.sub(r"\n?<<<END>>>\s*$","",text[m.end():end]).strip("\n")
    return d
def main():
    blocks=json.loads((WORK/"blocks.json").read_text()); man=json.loads((WORK/"manifest.json").read_text())
    trans={}
    for c in man:
        p=Path(c["out"])
        if not p.exists(): print("MISSING",p.name); continue
        trans.update(parse_blocks(p.read_text()))
    live=json.loads((WORK/"headings/live.json").read_text())
    soup=BeautifulSoup(SRC.read_text(),"html.parser"); root=soup.select_one("d-article")
    els=[]
    for el in root.find_all(TAGS):
        if el.find_parent(["script","style","pre","d-code"]): continue
        if any(c.name in TAGS for c in el.find_all(True)): continue
        text=el.get_text(" ",strip=True)
        if len(re.findall(r"[A-Za-z][A-Za-z'’\-]*",text))<2 and el.name not in ("h2","h3","h4","h5"): continue
        els.append(el)
    hi=0
    for i,el in enumerate(els):
        bid=f"h{i:04d}"
        if bid in trans:
            frag=BeautifulSoup(trans[bid],"html.parser")
            el.clear()
            for c in list(frag.children): el.append(c)
        if el.name in ("h2","h3","h4","h5"):
            if hi<len(live):
                aid=live[hi]["id"]
                el["id"]=aid
                anchor=soup.new_tag("a")
                anchor["id"]=aid
                el.insert_before(anchor)
            hi+=1
    OUT.write_text(str(soup))
    print("wrote",OUT,"blocks",len(els),"translated",len(trans),"headings",hi)
if __name__=="__main__": main()
