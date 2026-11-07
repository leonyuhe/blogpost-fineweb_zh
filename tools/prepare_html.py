#!/usr/bin/env python3
"""Extract translatable prose blocks from src/index.html."""
import json,re
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]; SRC=ROOT/"src/index.html"; WORK=ROOT/"work"; CH=WORK/"chunks"; OUT=WORK/"out"
WORD=re.compile(r"[A-Za-z][A-Za-z'’\-]*")
TAGS={"h2","h3","h4","h5","p","aside","li","td","th","figcaption","blockquote","summary"}

def main():
    CH.mkdir(parents=True,exist_ok=True); OUT.mkdir(parents=True,exist_ok=True)
    soup=BeautifulSoup(SRC.read_text(),"html.parser")
    root=soup.select_one("d-article")
    els=[]
    for el in root.find_all(TAGS):
        if el.find_parent(["script","style","pre","d-code"]): continue
        # leaf blocks only: skip elements containing another selected block
        if any(c.name in TAGS for c in el.find_all(True)): continue
        text=el.get_text(" ",strip=True)
        if len(WORD.findall(text))<2 and el.name not in ("h2","h3","h4","h5"): continue
        els.append(el)
    blocks=[]
    for i,el in enumerate(els):
        b={"id":f"h{i:04d}","tag":el.name,"attrs":dict(el.attrs),"html":el.decode_contents(),"words":len(WORD.findall(el.get_text(" ")))}
        blocks.append(b)
    # chunks
    chunks=[]; cur=[]; cw=0
    for b in blocks:
        if cur and cw+b["words"]>1200: chunks.append(cur); cur=[]; cw=0
        cur.append(b); cw+=b["words"]
    if cur: chunks.append(cur)
    man=[]
    for n,ch in enumerate(chunks,1):
        cid=f"chunk-{n:03d}"; out=[]
        for b in ch: out += [f"<<<BLOCK {b['id']}>>>", b["html"].strip("\n")]
        out.append("<<<END>>>")
        (CH/f"{cid}.txt").write_text("\n".join(out)+"\n")
        man.append({"id":cid,"blocks":[b["id"] for b in ch],"words":sum(b["words"] for b in ch),
                    "file":str(CH/f"{cid}.txt"),"out":str(OUT/f"{cid}.txt")})
    (WORK/"blocks.json").write_text(json.dumps(blocks,ensure_ascii=False,indent=1))
    (WORK/"manifest.json").write_text(json.dumps(man,ensure_ascii=False,indent=2))
    print(len(blocks),"blocks",len(chunks),"chunks",sum(b["words"] for b in blocks),"words")
    for c in man[:5]: print(c["id"],c["words"],len(c["blocks"]))
if __name__=="__main__": main()
