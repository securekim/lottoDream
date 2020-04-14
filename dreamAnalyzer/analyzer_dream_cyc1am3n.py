
#https://cyc1am3n.github.io/2018/11/10/classifying_korean_movie_review.html
# 불러오기
import pandas as pd
from os.path import dirname, join
def read_data(filename):
    with open(filename, 'r', encoding='UTF8') as f:
        data = [line.split('\t') for line in f.read().splitlines()]
        # txt 파일의 헤더(id document label)는 제외하기
        data = data[1:]
    return data

train_data = read_data(join(dirname(__file__),'./datas_added_19300.txt'))
test_data = read_data(join(dirname(__file__),'./datas_manual_1300.txt'))

print(len(train_data))
print(train_data[0])
print(len(test_data))
print(test_data[0])

# train_data = pd.read_table(join(dirname(__file__), './datas_added_19300.txt'))
# test_data = pd.read_table(join(dirname(__file__), './datas_manual_1300.txt'))

# 태깅
from konlpy.tag import Okt
import json
import os
from pprint import pprint
okt = Okt()

def tokenize(doc):
    # norm은 정규화, stem은 근어로 표시하기를 나타냄
    return ['/'.join(t) for t in okt.pos(doc, norm=True, stem=True)]

if os.path.isfile(join(dirname(__file__),'train_docs.json')):
    with open(join(dirname(__file__),'train_docs.json')) as f:
        train_docs = json.load(f)
    with open(join(dirname(__file__),'test_docs.json')) as f:
        test_docs = json.load(f)
else:
    train_docs = [(tokenize(row[1]), row[0]) for row in train_data]
    test_docs = [(tokenize(row[1]), row[0]) for row in test_data]
    # JSON 파일로 저장
    with open(join(dirname(__file__),'train_docs.json'), 'w', encoding="utf-8") as make_file:
        json.dump(train_docs, make_file, ensure_ascii=False, indent="\t")
    with open(join(dirname(__file__),'test_docs.json'), 'w', encoding="utf-8") as make_file:
        json.dump(test_docs, make_file, ensure_ascii=False, indent="\t")

    # train_docs = [(tokenize(row[1]), row[2]) for row in train_data]
    # test_docs = [(tokenize(row[1]), row[2]) for row in test_data]
# 예쁘게(?) 출력하기 위해서 pprint 라이브러리 사용
pprint(train_docs[0])

#nltk 라이브러리를 통해서 전처리
tokens = [t for d in train_docs for t in d[0]]

import nltk
text = nltk.Text(tokens, name='NMSC')

# 전체 토큰의 개수
print(len(text.tokens))

# 중복을 제외한 토큰의 개수
print(len(set(text.tokens)))            

# 출현 빈도가 높은 상위 토큰 10개
pprint(text.vocab().most_common(10))

# 상위 보여주기
# import matplotlib.pyplot as plt
# from matplotlib import font_manager, rc
# #%matplotlib inline

# font_fname = '/Library/Fonts/AppleGothic.ttf'
# font_name = font_manager.FontProperties(fname=font_fname).get_name()
# rc('font', family=font_name)

# plt.figure(figsize=(20,10))
# text.plot(50)

#자주 쓰이는 만개 데이터로 
selected_words = [f[0] for f in text.vocab().most_common(10000)]

def term_frequency(doc):
    return [doc.count(word) for word in selected_words]

train_x = [term_frequency(d) for d, _ in train_docs]
test_x = [term_frequency(d) for d, _ in test_docs]
train_y = [c for _, c in train_docs]
test_y = [c for _, c in test_docs]

# import numpy as np
# >>> a = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9])
# >>> b = np.array([3,4,7])
# >>> c = np.setdiff1d(a,b)
# >>> c
# array([1, 2, 5, 6, 8, 9])

import numpy as np

#불용어 제거
stopwords = ["꿈"]

train_tmp = np.setdiff1d(np.array(train_x), np.array(stopwords))
test_tmp = np.setdiff1d(np.array(test_x), np.array(stopwords))

#float 로 형 변환
x_train = np.asarray(train_tmp).astype('float32')
x_test = np.asarray(test_tmp).astype('float32')

y_train = np.asarray(train_y).astype('float32')
y_test = np.asarray(test_y).astype('float32')

# 기계학습

print("START AI")

from tensorflow.keras import models
from tensorflow.keras import layers
from tensorflow.keras import optimizers
from tensorflow.keras import losses
from tensorflow.keras import metrics

model = models.Sequential()
model.add(layers.Dense(64, activation='relu', input_shape=(10000,)))
model.add(layers.Dense(64, activation='relu'))
model.add(layers.Dense(1, activation='sigmoid'))

model.compile(optimizer=optimizers.RMSprop(lr=0.001),
             loss=losses.binary_crossentropy,
             metrics=[metrics.binary_accuracy])

model.fit(x_train, y_train, epochs=10, batch_size=512)
results = model.evaluate(x_test, y_test)


print("END AI")

def predict_pos_neg(review):
    token = tokenize(review)
    tf = term_frequency(token)
    data = np.expand_dims(np.asarray(tf).astype('float32'), axis=0)
    score = float(model.predict(data))
    if(score > 0.5):
        print("[{}]는 {:.2f}% 확률로 긍정 리뷰이지 않을까 추측해봅니다.^^\n".format(review, score * 100))
    else:
        print("[{}]는 {:.2f}% 확률로 부정 리뷰이지 않을까 추측해봅니다.^^;\n".format(review, (1 - score) * 100))

print("PREDICT")

predict_pos_neg("똥을 먹는 꿈이었어요.")
predict_pos_neg("싸이코패스 할아버지가 나와서 다른 사람들을 죽였습니다.")
predict_pos_neg("동성과 성관계하는 꿈을 꿨습니다.")
predict_pos_neg("동성과 섹스하는 꿈을 꿨습니다.")
predict_pos_neg("벚꽃이 활짝 핀 공원에서 연인과 함께 산책하는 꿈을 꾸었습니다. 그런데 도중에 강도를 만나 칼에 찔렸습니다.")
