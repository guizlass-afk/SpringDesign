from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from pathlib import Path
import math,json,tempfile
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)));Thread(target=server.serve_forever,daemon=True).start()
def close(a,b):assert math.isclose(a,b,rel_tol=1e-8,abs_tol=1e-8),(a,b)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(channel='chrome',headless=True)
  page=browser.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(f'http://127.0.0.1:{server.server_port}/');page.wait_for_function('window.SpringApp')
  source=dict(type='compression',d=2,D=20,n=8,L=45,travel=10,initial=5,G=80000,E=200000,allowable=None)
  calc=lambda p:page.evaluate('(p)=>{const r=SpringMechanics.calculate(p);delete r.loadAt;return r}',p)
  v=calc(source);close(v['rate'],2.5);close(v['load'],25);close(v['solid'],20);close(v['available'],25);close(v['energy'],.125)
  close(v['stress'],((40-1)/(40-4)+.615/10)*8*25*20/(math.pi*2**3))
  e=calc(dict(source,type='extension'));close(e['load'],30);close(e['energy'],.175);close(e['length'],28)
  tor=calc(dict(source,type='torsion',travel=45));rate=200000*16/(10.8*20*8*360);close(tor['rate'],rate);close(tor['load'],rate*45);close(tor['length'],18);close(tor['stress'],(389/360)*32*(rate*45)/(math.pi*8));close(tor['energy'],.5*rate*45*math.radians(45)/1000)
  for patch in [dict(d=0),dict(D=1),dict(n=0),dict(n=101),dict(travel=-1),dict(L=15),dict(travel=25),dict(G=0),dict(allowable=-1)]:assert calc(dict(source,**patch))['errors'],patch
  assert 'stressNote' in calc(dict(source,allowable=1))['warnings']
  assert calc(dict(source,d=1e100,D=1e101))['errors']
  before=page.evaluate('SpringApp.result.load');page.select_option('#units','imperial');close(page.evaluate('SpringApp.result.load'),before);page.select_option('#units','metric')
  page.fill('#input-d','');assert page.locator('#error').is_visible();assert page.locator('#svgExport').is_disabled();page.fill('#input-d','2');assert page.locator('#error').is_hidden()
  for kind in ['compression','extension','torsion']:
   page.click(f'[data-type={kind}]');page.locator('#simulation').fill('100');page.locator('#simulation').dispatch_event('input');assert page.locator('#drawing svg').count()==1
   assert 'NaN' not in page.locator('#validContent').inner_text();assert 'Infinity' not in page.locator('#validContent').inner_text()
   for selector,suffix in [('#svgExport','.svg'),('#csvExport','.csv')]:
    with page.expect_download() as d:page.click(selector)
    download=d.value;assert download.suggested_filename.endswith(suffix)
    text=Path(download.path()).read_text(encoding='utf-8-sig');assert 'NaN' not in text and 'Infinity' not in text
    if suffix=='.svg':
     import xml.etree.ElementTree as ET
     ET.fromstring(text)
   page.screenshot(path=str(Path(tempfile.gettempdir())/f'spring-{kind}.png'),full_page=True)
  languages=page.evaluate('Object.keys(SpringTranslations)');assert len(languages)==12
  for lang in languages:
   page.evaluate('(lang)=>SpringApp.setLanguage(lang)',lang)
   assert page.locator('html').get_attribute('lang')==lang
   assert page.locator('html').get_attribute('dir')==('rtl' if lang=='ar-SA' else 'ltr')
   assert page.evaluate("[...document.querySelectorAll('[data-i18n]')].every(e=>e.textContent!==e.dataset.i18n)")
   assert page.evaluate("Object.keys(SpringTranslations['en-US']).every(k=>!!SpringTranslations[document.documentElement.lang][k])")
  page.evaluate("SpringApp.setLanguage('pt-BR')");page.click('#reset');page.click('#themeToggle');page.screenshot(path=str(Path(tempfile.gettempdir())/'spring-dark.png'),full_page=True)
  for width in [390,768,1440]:
   page.set_viewport_size({'width':width,'height':900});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
  page.set_viewport_size({'width':390,'height':844});page.screenshot(path=str(Path(tempfile.gettempdir())/'spring-mobile.png'),full_page=True)
  assert not errors,errors
  print('PASS: independent mechanics, invalid inputs, unit invariance, three drawings, SVG/CSV downloads, 12 languages/RTL, theme and responsive layout')
  browser.close()
finally:server.shutdown()
