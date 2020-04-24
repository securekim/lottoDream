#-*- coding:utf-8 -*-
#https://wikidocs.net/44249
import pandas as pd
import urllib.request
#%matplotlib inline
import matplotlib.pyplot as plt
import re
#from konlpy.tag import Okt
from konlpy.tag import Kkma
import os
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.layers import Embedding, Dense, LSTM
from tensorflow.keras.models import Sequential
from tensorflow.keras.models import load_model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from os.path import dirname, join
#FOR SERVER
from flask import Flask
from flask_restful import Resource, Api
from flask_restful import reqparse
os.environ['PYTHONHASHSEED'] = '0'

#os.environ['CUDA_VISIBLE_DEVICES'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# 수집할 태그 (okt 용)
# essential_tags = ['Noun', 'Adjective', 'Verb', 'Adverb'] 

# 수집할 태그 (KKMA 용) - 앞쪽에 많이 쓰이는 태그가 있어야 빨라짐
#  'NP': '대명사',
#  'NN': '명사',
#  'NNG': '보통명사',
#  'NNP': '고유명사',
#  'VV': '동사',
#  'VA': '형용사',
#  'VXA': '보조 형용사',
#  'MDN': '수 관형사',
essential_tags = ['NP', 'NN', 'NNG', 'NNP', 'VV', 'VA', 'VXA', 'MDN'] 
# 문제 : NN의 경우 NNG, NNB, NNM, NNP 에서 모두 포함되므로 안된다!
# 문제2 : 발견되면 중간에 끊고 다음 단어 (break).

def only_es_tags(arr):
    resultlist = []
    for word in arr:
        for essential in essential_tags:
            if word.split('/')[1] == essential:
                resultlist.append(word)
                break
    return resultlist


#1. 데이터 로드
# train_data = pd.read_table(join(dirname(__file__), './interpretation_train_pos_neg.txt'))
# test_data = pd.read_table(join(dirname(__file__), './interpretation_test_pos_neg.txt'))
# predict_data = pd.read_table(join(dirname(__file__), './interpretation_predict.txt'))

train_data = pd.read_table(join(dirname(__file__), './datas_merged_19300.txt'))
test_data = pd.read_table(join(dirname(__file__), './datas_manual_1300.txt'))

#train_data = pd.read_table('ratings_train.txt')
#test_data = pd.read_table('ratings_test.txt')

print('훈련용 해몽 개수 :',len(train_data))
print('테스트용 해몽 개수 :',len(test_data)) # 테스트용 리뷰 개수 출력
#print('예측용 해몽 개수 :',len(predict_data))

#2. 데이터 정제 (중복항목제거)
train_data['document'].nunique(), train_data['label'].nunique()
train_data.drop_duplicates(subset=['document'], inplace=True) 
print('총 샘플의 수 :',len(train_data))
# 레이블 분포 그래프 표시
#train_data['label'].value_counts().plot(kind = 'bar')

print(train_data.isnull().values.any()) # 혹시 NULL 인게 있는지(있으면 TRUE)
train_data = train_data.dropna(how = 'any') # Null 값이 존재하는 행 제거

korean = "[^ㄱ-ㅎㅏ-ㅣ가-힣 ]"

train_data['document'] = train_data['document'].str.replace(korean,"") # 한글과 공백을 제외하고 모두 제거
train_data['document'].replace('', np.nan, inplace=True) #NaN 제거
train_data = train_data.dropna(how = 'any')#제거하고 null 또 제거
print(len(train_data))


#### 테스트 데이터에도 동일하게 수행
test_data.drop_duplicates(subset = ['document'], inplace=True) # document 열에서 중복인 내용이 있다면 중복 제거
test_data['document'] = test_data['document'].str.replace(korean,"") # 정규 표현식 수행
test_data['document'].replace('', np.nan, inplace=True) # 공백은 Null 값으로 변경
test_data = test_data.dropna(how='any') # Null 값 제거
print('전처리 후 테스트용 샘플의 개수 :',len(test_data))

# 3. 토큰화
#train_data에 형태소 분석기를 사용하여 토큰화를 하면서 불용어를 제거하여 X_train에 저장합니다.

X_train = []
#okt = Okt()
kkma = Kkma()
for sentence in train_data['document']:
    temp_X = []
    #temp_X = okt.pos(sentence, stem=True, join=True) # 토큰화
    temp_X = kkma.pos(sentence ,join=True) # 토큰화
    temp_X = only_es_tags(temp_X) #[word for word in temp_X if not word in stopwords] # 불용어 제거
    X_train.append(temp_X)

print(X_train[:3])

#테스트 데이터에도 수행
X_test = []
for sentence in test_data['document']:
    temp_X = []
    temp_X = kkma.pos(sentence, join=True) # 토큰화
    temp_X = only_es_tags(temp_X) # 불용어 제거
    X_test.append(temp_X)

    
# #예측 데이터에도 수행
# X_predict = []
# for sentence in predict_data['document']:
#     temp_X = []
#     temp_X = okt.pos(sentence, stem=True, join=True) # 토큰화
#     temp_X = [word for word in temp_X if not word in stopwords] # 불용어 제거
#     X_predict.append(temp_X)

# 정수 인코딩
tokenizer = Tokenizer()
tokenizer.fit_on_texts(X_train)
#print(tokenizer.word_index)

#빈도수만큼 제거하는 코드
#단어 빈도 threshold회 미만
threshold = 1
total_cnt = len(tokenizer.word_index) # 단어의 수
rare_cnt = 0 # 등장 빈도수가 threshold보다 작은 단어의 개수를 카운트
total_freq = 0 # 훈련 데이터의 전체 단어 빈도수 총 합
rare_freq = 0 # 등장 빈도수가 threshold보다 작은 단어의 등장 빈도수의 총 합

# 단어와 빈도수의 쌍(pair)을 key와 value로 받는다.
for key, value in tokenizer.word_counts.items():
    total_freq = total_freq + value

    # 단어의 등장 빈도수가 threshold보다 작으면
    if(value < threshold):
        rare_cnt = rare_cnt + 1
        rare_freq = rare_freq + value

print('단어 집합(vocabulary)의 크기 :',total_cnt)
print('등장 빈도가 %s번 이하인 희귀 단어의 수: %s'%(threshold - 1, rare_cnt))
print("단어 집합에서 희귀 단어의 비율:", (rare_cnt / total_cnt)*100)
print("전체 등장 빈도에서 희귀 단어 등장 빈도 비율:", (rare_freq / total_freq)*100)
vocab_size = total_cnt - rare_cnt + 1 # 전체 단어 개수 중 빈도수 이하인 단어 개수는 제거. 0번 패딩 토큰을 고려하여 +1

print('단어 집합의 크기 :',vocab_size)

tokenizer = Tokenizer(vocab_size) 
tokenizer.fit_on_texts(X_train)
X_train = tokenizer.texts_to_sequences(X_train)
X_test = tokenizer.texts_to_sequences(X_test)
# X_predict = tokenizer.texts_to_sequences(X_predict)

y_train = np.array(train_data['label'])
y_test = np.array(test_data['label'])
# y_predict = np.array(predict_data['label'])

#5. 빈 샘플 제거
drop_train = [index for index, sentence in enumerate(X_train) if len(sentence) < 1]
drop_test = [index for index, sentence in enumerate(X_test) if len(sentence) < 1]
#drop_predict = [index for index, sentence in enumerate(X_predict) if len(sentence) < 1]

# 트레이닝 빈 샘플 제거
X_train = np.delete(X_train, drop_train, axis=0)
y_train = np.delete(y_train, drop_train, axis=0)
print("트레이닝 : "+str(len(X_train)))
print("트레이닝 : "+str(len(y_train)))

# 테스트 빈 샘플 제거
X_test = np.delete(X_test, drop_test, axis=0)
y_test = np.delete(y_test, drop_test, axis=0)
print("테스트 : "+str(len(X_test)))
print("테스트 : "+str(len(y_test)))

# 예측 빈 샘플 제거
# X_predict = np.delete(X_predict, drop_predict, axis=0)
# y_predict = np.delete(y_predict, drop_predict, axis=0)
# print("예측 : "+str(len(X_predict)))
# print("예측 : "+str(len(y_predict)))

# 6. 패딩
print('해몽의 최대 길이 :',max(len(l) for l in X_train))
print('해몽의 평균 길이 :',sum(map(len, X_train))/len(X_train))

# 샘플 단어의 길이 그래프 표시
#plt.hist([len(s) for s in X_train], bins=50)
#plt.xlabel('length of samples')
#plt.ylabel('number of samples')
#plt.show()


# 샘플 길이 자르기
def below_threshold_len(max_len, nested_list):
  cnt = 0
  for s in nested_list:
    if(len(s) <= max_len):
        cnt = cnt + 1
  print('전체 샘플 중 길이가 %s 이하인 샘플의 비율: %s'%(max_len, (cnt / len(nested_list))*100))

max_len = 31
below_threshold_len(max_len, X_train)

X_train = pad_sequences(X_train, maxlen = max_len)
X_test = pad_sequences(X_test, maxlen = max_len)
# X_predict = pad_sequences(X_predict, maxlen = max_len)

###### LSTM 으로 분류


model = Sequential()
model.add(Embedding(vocab_size, 100))
model.add(LSTM(128, stateful = False))
model.add(Dense(1, activation='sigmoid'))

es = EarlyStopping(monitor='val_loss', mode='min', verbose=1, patience=4)
mc = ModelCheckpoint('best_model.h5', monitor='val_acc', mode='max', verbose=1, save_best_only=True)

model.compile(optimizer='rmsprop', loss='binary_crossentropy', metrics=['acc'])
history = model.fit(X_train, y_train, epochs=15, callbacks=[es, mc], batch_size=60, validation_split=0.2)

#model.save('best_model2.h5')  # creates a HDF5 file 'my_model.h5'

model_json = model.to_json()
with open("model.json", "w") as json_file : 
    json_file.write(model_json)

model.save_weights("model.h5")

loaded_model = load_model('best_model2.h5')
loaded_model.summary()
#print("\n 테스트 정확도: %.4f" % (loaded_model.evaluate(X_test, y_test)[1]))


#훈련과 검증 손실 그리기
# history_dict = history.history
# loss = history_dict['loss']
# val_loss = history_dict['val_loss']

# epochs = range(1, len(loss) + 1)

# plt.plot(epochs, loss, 'bo', label='Training loss')  # ‘bo’는 파란색 점을 의미합니다.
# plt.plot(epochs, val_loss, 'b', label='Validation loss') # ‘b’는 파란색 실선을 의미합니다.
# plt.title('Training and validation loss')
# plt.xlabel('Epochs')
# plt.ylabel('Loss')
# plt.legend()
# plt.show()

# #훈련과 손실 정확도 그리기
# plt.clf() # 그래프를 초기화합니다.
# acc = history_dict['acc']
# val_acc = history_dict['val_acc']

# plt.plot(epochs, acc, 'bo', label='Training acc')
# plt.plot(epochs, val_acc, 'b', label='Validation acc')
# plt.title('Training and validation accuracy')
# plt.xlabel('Epochs')
# plt.ylabel('Accuracy')
# plt.legend()
# plt.show()


## 실제로 predict 해보자
# xhat = loaded_model.predict(X_predict)
# xhatc = loaded_model.predict_classes(X_predict)
# np.set_printoptions(suppress=True)
# np.set_printoptions(formatter={'float_kind': lambda x: "{0:0.3f}".format(x)})
# x = np.array(xhat)
# xc = np.array(xhatc)
# np.savetxt("predictedData.txt", x)
# np.savetxt("predictedData_class.txt", xc)

def analyze_dream(dream):
    dream.replace(korean,"")
    temp_x = []
    temp_x = kkma.pos(dream, join=True) # 토큰화
    temp_x = only_es_tags(temp_x) # 불용어 제거
    return temp_x

def predict_dream(dream):
    temp_x = analyze_dream(dream)
    x_predict_dream = []
    x_predict_dream.append(temp_x)
    x_predict_dream = tokenizer.texts_to_sequences(x_predict_dream)
    x_predict_dream = pad_sequences(x_predict_dream, maxlen = 500) # 500으로 늘려주자
    score = float(loaded_model.predict(x_predict_dream))
    return score
    # if(score > 0.5):
    #     print("    길몽의 기운이 더 많습니다. 길몽력 : {:.2f}% \n    현재 정확도 : 71.90% ~ 87.53%".format(score * 100))
    # else:
    #     print("    흉몽의 기운이 더 많습니다. 흉몽력 : {:.2f}% \n    현재 정확도 : 71.90% ~ 87.53%".format((1 - score) * 100))

# predict_dream("똥을 먹는 꿈이었어요.") #길
# predict_dream("똥을 뒤집어쓰고 손으로 만졌어요.") #길
# predict_dream("싸이코패스 할아버지가 나와서 다른 사람들을 죽였습니다.") #길
# predict_dream("돈에 깔려 죽었습니다.") #길
# predict_dream("꿈에 돼지가 나왔는데 꿀꿀거리면서 돌아다니더라구요.") #길
# predict_dream("돼지를 안고 있었어요.") #길
# predict_dream("집이 불에 타버렸는데 저는 가까스로 탈출 했어요.") #길
# predict_dream("비행기를 타고 해외로 나갔어요.") #길
# predict_dream("엄청 큰 두꺼비가 맑은 물에 있었어요.") #길
# predict_dream("조상님이 찾아와서 돈을 주셨어요.") #길
# predict_dream("아기를 많이 낳았어요.") #길
# predict_dream("잘 자란 싱싱한 무가 집안에 가득 차 있었어요.") #길
# predict_dream("칼에 찔려서 피가 많이 났어요.") #길
# predict_dream("꿈에 돼지가 나왔는데 저를 공격했습니다.") #흉
# predict_dream("집에 불이 났는데 힘들게 불을 껐어요.") #흉


 
app = Flask(__name__)
api = Api(app)
class dreamScore(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('dream', type=str)
        #parser.add_argument('email', type=str)
        args = parser.parse_args()
 
        dream = args['dream']
        score = predict_dream(dream)
        print("dream : ", dream, " score : ", score)
        #email = args['email']
        #return {'name': name , 'email' : email}
        return {'score' : score}
 
class dreamAnalyze(Resource):
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument('dream', type=str)
        #parser.add_argument('email', type=str)
        args = parser.parse_args()
 
        dream = args['dream']
        analized = analyze_dream(dream)
        print("morph : ", dream, " analized : ", analized)
        #email = args['email']
        #return {'name': name , 'email' : email}
        return {'morph' : analized}

api.add_resource(dreamScore, '/dreamScore')
api.add_resource(dreamAnalyze, '/dreamAnalyze')
 
if __name__ == '__main__':
    app.run()



