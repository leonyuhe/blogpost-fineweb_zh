#!/usr/bin/env python3
import json,re
from pathlib import Path
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]; WORK=ROOT/"work"
CJK=re.compile(r"[\u4e00-\u9fff]"); WORD=re.compile(r"[A-Za-z][A-Za-z'’\-]*")
def parse_blocks(text):
    d={}; order=[]; pat=re.compile(r"^<<<BLOCK ([^>\s]+)>>>[ \t]*$",re.M); ms=list(pat.finditer(text))
    for i,m in enumerate(ms):
        end=ms[i+1].start() if i+1<len(ms) else len(text)
        d[m.group(1)]=re.sub(r"\n?<<<END>>>\s*$","",text[m.end():end]).strip("\n"); order.append(m.group(1))
    return d,order
def sig(s):
    soup=BeautifulSoup(s,"html.parser")
    return tuple((t.name,tuple(sorted((k,None if k in ("title","alt","aria-label") else v) for k,v in t.attrs.items()))) for t in soup.find_all(True))
def links(s): return sorted(a.get("href") for a in BeautifulSoup(s,"html.parser").find_all("a") if a.get("href"))
def codes(s): return sorted(c.get_text() for c in BeautifulSoup(s,"html.parser").find_all("code"))
def main():
    blocks={b["id"]:b for b in json.loads((WORK/"blocks.json").read_text())}
    man=json.loads((WORK/"manifest.json").read_text()); bad=0; miss=[]
    for c in man:
        p=Path(c["out"])
        if not p.exists(): miss.append(c["id"]); continue
        tr,order=parse_blocks(p.read_text())
        if order!=c["blocks"]: print(c["id"],"ORDER"); bad+=1; continue
        errs=[]
        for bid in c["blocks"]:
            src=blocks[bid]["html"]; dst=tr.get(bid,"")
            if sig(src)!=sig(dst): errs.append((bid,["tags"]))
            if links(src)!=links(dst): errs.append((bid,["links"]))
            if codes(src)!=codes(dst): errs.append((bid,["code"]))
            cjk=len(CJK.findall(dst)); eng=len(WORD.findall(dst))
            if eng>100 and cjk<eng*0.08: errs.append((bid,[f"low zh {cjk}/{eng}"]))
        if errs:
            bad+=1; print(f"\n[{c['id']}]")
            for bid,e in errs[:5]: print(" ",bid,e)
    print(f"\nchecked {len(man)-len(miss)}/{len(man)} bad {bad} missing {miss}")
if __name__=="__main__": main()
