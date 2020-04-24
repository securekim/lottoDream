#-*- coding:utf-8 -*-
from konlpy.tag import Kkma
from konlpy.tag import Okt
from konlpy.tag import Komoran
from konlpy.tag import Hannanum
from konlpy.tag import Twitter
from konlpy.utils import pprint
kkma = Kkma()
okt = Okt()
komoran = Komoran()
hannanum = Hannanum()
twitter = Twitter()


#pprint(kkma.tagset)

# {'EC': '연결 어미',
#  'ECD': '의존적 연결 어미',
#  'ECE': '대등 연결 어미',
#  'ECS': '보조적 연결 어미',
#  'EF': '종결 어미',
#  'EFA': '청유형 종결 어미',
#  'EFI': '감탄형 종결 어미',
#  'EFN': '평서형 종결 어미',
#  'EFO': '명령형 종결 어미',
#  'EFQ': '의문형 종결 어미',
#  'EFR': '존칭형 종결 어미',
#  'EP': '선어말 어미',
#  'EPH': '존칭 선어말 어미',
#  'EPP': '공손 선어말 어미',
#  'EPT': '시제 선어말 어미',
#  'ET': '전성 어미',
#  'ETD': '관형형 전성 어미',
#  'ETN': '명사형 전성 어미',
#  'IC': '감탄사',
#  'JC': '접속 조사',
#  'JK': '조사',
#  'JKC': '보격 조사',
#  'JKG': '관형격 조사',
#  'JKI': '호격 조사',
#  'JKM': '부사격 조사',
#  'JKO': '목적격 조사',
#  'JKQ': '인용격 조사',
#  'JKS': '주격 조사',
#  'JX': '보조사',
#  'MA': '부사',
#  'MAC': '접속 부사',
#  'MAG': '일반 부사',
#  'MD': '관형사',
#  'MDN': '수 관형사',
#  'MDT': '일반 관형사',
#  'NN': '명사',
#  'NNB': '일반 의존 명사',
#  'NNG': '보통명사',
#  'NNM': '단위 의존 명사',
#  'NNP': '고유명사',
#  'NP': '대명사',
#  'NR': '수사',
#  'OH': '한자',
#  'OL': '외국어',
#  'ON': '숫자',
#  'SE': '줄임표',
#  'SF': '마침표, 물음표, 느낌표',
#  'SO': '붙임표(물결,숨김,빠짐)',
#  'SP': '쉼표,가운뎃점,콜론,빗금',
#  'SS': '따옴표,괄호표,줄표',
#  'SW': '기타기호 (논리수학기호,화폐기호)',
#  'UN': '명사추정범주',
#  'VA': '형용사',
#  'VC': '지정사',
#  'VCN': "부정 지정사, 형용사 '아니다'",
#  'VCP': "긍정 지정사, 서술격 조사 '이다'",
#  'VV': '동사',
#  'VX': '보조 용언',
#  'VXA': '보조 형용사',
#  'VXV': '보조 동사',
#  'XP': '접두사',
#  'XPN': '체언 접두사',
#  'XPV': '용언 접두사',
#  'XR': '어근',
#  'XSA': '형용사 파생 접미사',
#  'XSN': '명사파생 접미사',
#  'XSV': '동사 파생 접미사'}

#pprint(kkma.pos(u'오류보고는 실행환경, 에러메세지와함께 설명을 최대한상세히!^^'))

# [('오류', 'NNG'), 보통명사
#  ('보고', 'NNG'), 보통명사
#  ('는', 'JX'),    보조사
#  ('실행', 'NNG'), 보통명사
#  ('환경', 'NNG'), 보통명사
#  (',', 'SP'),     쉼표,가운뎃점,콜론,빗금
#  ('에러', 'NNG'), 보통명사
#  ('메세지', 'NNG'),보통명사
#  ('와', 'JKM'),   부사격 조사
#  ('함께', 'MAG'), 일반 부사
#  ('설명', 'NNG'), 보통명사
#  ('을', 'JKO'),   목적격 조사
#  ('최대한', 'NNG'),보통명사
#  ('상세히', 'MAG'),일반 부사
#  ('!', 'SF'),     마침표, 물음표, 느낌표
#  ('^^', 'EMO')]   

analyze_str = u'나는 하늘을 나는 자동차를 탔다'
print("[kkma]"      ,kkma.pos(analyze_str))
print("[okt] "      ,okt.pos(analyze_str))
print("[komoran]"   ,komoran.pos(analyze_str))
print("[hannanum]"  ,hannanum.pos(analyze_str))
print("[twitter]"   ,twitter.pos(analyze_str))
print("\n")

analyze_str = u'결국 그날 날선 눈빛으로 날 노려본 뒤 날쌘 몸짓으로 날아와 날이 선 손을 내밀었다.'
print("[kkma]"      ,kkma.pos(analyze_str))
print("[okt] "      ,okt.pos(analyze_str))
print("[komoran]"   ,komoran.pos(analyze_str))
print("[hannanum]"  ,hannanum.pos(analyze_str))
print("[twitter]"   ,twitter.pos(analyze_str))
print("\n")

