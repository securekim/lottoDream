#https://wikidocs.net/44249
import pandas as pd
import urllib.request
#%matplotlib inline
import matplotlib.pyplot as plt
import re
from konlpy.tag import Okt
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
os.environ['PYTHONHASHSEED'] = '0'

#os.environ['CUDA_VISIBLE_DEVICES'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'



#1. 데이터 로드
#train_data = pd.read_table(join(dirname(__file__), './interpretation_train_pos_neg.txt'))
#test_data = pd.read_table(join(dirname(__file__), './interpretation_test_pos_neg.txt'))
#predict_data = pd.read_table(join(dirname(__file__), './interpretation_predict.txt'))

train_data = pd.read_table(join(dirname(__file__), './datas_crawled_14300.txt'))
test_data = pd.read_table(join(dirname(__file__), './datas_manual_5000.txt'))
predict_data = pd.read_table(join(dirname(__file__), './datas_manual_1300.txt'))


#train_data = pd.read_table('ratings_train.txt')
#test_data = pd.read_table('ratings_test.txt')

print('훈련용 해몽 개수 :',len(train_data))
print('테스트용 해몽 개수 :',len(test_data)) # 테스트용 리뷰 개수 출력
print('예측용 해몽 개수 :',len(predict_data))

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

#### 예측 데이터에는 동일하게 수행하면 안됨.
#predict_data.drop_duplicates(subset = ['document'], inplace=True) # document 열에서 중복인 내용이 있다면 중복 제거
predict_data['document'] = predict_data['document'].str.replace(korean,"") # 정규 표현식 수행
predict_data['document'].replace('', np.nan, inplace=True) # 공백은 Null 값으로 변경
#predict_data = predict_data.dropna(how='any') # Null 값 제거
print('전처리 후 예측 샘플의 개수 :',len(predict_data))

# 3. 토큰화
#train_data에 형태소 분석기를 사용하여 토큰화를 하면서 불용어를 제거하여 X_train에 저장합니다.
stopwords =['꿈'
,'아이구'
,'아이쿠'
,'아이고'
,'우리'
,'저희'
,'따라'
,'의해'
,'을'
,'를'
,'에'
,'의'
,'가'
,'으로'
,'로'
,'에게'
,'뿐이다'
,'의거하여'
,'근거하여'
,'입각하여'
,'기준으로'
,'예하면'
,'예를 들면'
,'예를 들자면'
,'저'
,'저희'
,'지말고'
,'하지마'
,'하지마라'
,'다른'
,'물론'
,'또한'
,'그리고'
,'비길수 없다'
,'해서는 안된다'
,'뿐만 아니라'
,'만이 아니다'
,'만은 아니다'
,'막론하고'
,'관계없이'
,'그치지 않다'
,'그러나'
,'그런데'
,'하지만'
,'든간에'
,'비록'
,'더라도'
,'아니면'
,'만 못하다'
,'하는 편이 낫다'
,'틈타'
,'타다'
,'오르다'
,'제외하고'
,'이 외에'
,'이 밖에'
,'하여야'
,'비로소'
,'한다면 몰라도'
,'외에도'
,'이곳'
,'여기'
,'부터'
,'할 생각이다'
,'하려고하다'
,'이리하여'
,'그리하여'
,'그렇게 함으로써'
,'일때'
,'할때'
,'중에서'
,'으로써'
,'로써'
,'까지'
,'해야한다'
,'일것이다'
,'반드시'
,'임에 틀림없다'
,'등'
,'등등'
,'제'
,'다만'
,'할뿐'
,'댕그'
,'대해서'
,'대하여'
,'대하면'
,'얼마나'
,'얼마만큼'
,'얼마큼'
,'남짓'
,'여'
,'얼마간'
,'몇'
,'얼마'
,'지만'
,'하물며'
,'또한'
,'그러나'
,'그렇지만'
,'하지만'
,'이외에도'
,'대해 말하자면'
,'뿐이다'
,'다음에'
,'바꾸어서 말하면'
,'바꾸어서 한다면'
,'만약'
,'그렇지않으면'
,'보드득'
,'응당'
,'해야한다'
,'에 가서'
,'여러분'
,'각종'
,'제각기'
,'와'
,'과'
,'그러므로'
,'그래서'
,'고로'
,'한 까닭에'
,'하기 때문에'
,'거니와'
,'이지만'
,'대하여'
,'관하여'
,'관한'
,'과연'
,'실로'
,'아니나다를까'
,'한적이있다'
,'하곤하였다'
,'아하'
,'거바'
,'와'
,'오'
,'왜'
,'어째서'
,'무엇때문에'
,'어찌'
,'하겠는가'
,'무슨'
,'어디'
,'어느곳'
,'더군다나'
,'하물며'
,'더욱이는'
,'어느때'
,'언제'
,'야'
,'이봐'
,'어이'
,'여보시오'
,'휴'
,'여차'
,'어기여차'
,'앗'
,'솨'
,'그래도'
,'또'
,'그리고'
,'바꾸어말하면'
,'바꾸어말하자면'
,'혹은'
,'혹시'
,'답다'
,'및'
,'그에 따르는'
,'즉'
,'지든지'
,'설령'
,'가령'
,'하더라도'
,'할지라도'
,'일지라도'
,'지든지'
,'몇'
,'거의'
,'하마터면'
,'인젠'
,'이젠'
,'된바에야'
,'된이상'
,'만큼'
,'그위에'
,'게다가'
,'점에서 보아'
,'비추어 보아'
,'고려하면'
,'하게될것이다'
,'일것이다'
,'좀'
,'비하면'
,'연이서'
,'이어서'
,'잇따라'
,'뒤이어'
,'의지하여'
,'기대여'
,'통하여'
,'자마자'
,'더욱더'
,'밖에 안된다'
,'하면된다'
,'그래'
,'그렇지'
,'요컨대'
,'다시 말하자면'
,'바꿔 말하면'
,'즉'
,'구체적으로'
,'말하자면'
,'시초에'
,'허'
,'헉'
,'허걱'
,'바와같이'
,'더구나'
,'하물며'
,'동안'
,'이래'
,'하고있었다'
,'이었다'
,'에서'
,'로부터'
,'까지'
,'예하면'
,'했어요'
,'해요'
,'마저'
,'습니다'
,'가까스로'
,'하려고하다'
,'즈음하여'
,'다른 방면으로'
,'해봐요'
,'습니까'
,'했어요'
,'말할것도 없고'
,'무릎쓰고'
,'개의치않고'
,'하는것만 못하다'
,'하는것이 낫다'
,'매'
,'매번'
,'들'
,'모'
,'어느것'
,'어느'
,'로써'
,'갖고말하자면'
,'어디'
,'어느쪽'
,'어느것'
,'어느해'
,'어느 년도'
,'라 해도'
,'언젠가'
,'어떤것'
,'어느것'
,'저기'
,'저쪽'
,'저것'
,'그때'
,'그럼'
,'그러면'
,'요만한걸'
,'그래'
,'그때'
,'저것만큼'
,'그저'
,'이르기까지'
,'할 줄 안다'
,'할 힘이 있다'
,'너'
,'너희'
,'당신'
,'어찌'
,'설마'
,'할지언정'
,'할지라도'
,'할망정'
,'할지언정'
,'쳇'
,'의거하여'
,'근거하여'
,'의해'
,'따라'
,'힘입어'
,'그'
,'다음'
,'버금'
,'두번째로'
,'기타'
,'첫번째로'
,'나머지는'
,'그중에서'
,'견지에서'
,'위해서'
,'단지'
,'의해되다'
,'하도록시키다'
,'뿐만아니라'
,'반대로'
,'앞의것'
,'잠시'
,'잠깐'
,'하면서'
,'그렇지만'
,'다음에'
,'그러한즉'
,'그런즉'
,'남들'
,'아무거나'
,'어찌하든지'
,'같다'
,'비슷하다'
,'예컨대'
,'이럴정도로'
,'어떻게'
,'만약'
,'만일'
,'위에서 서술한바와같이'
,'인 듯하다'
,'하지 않는다면'
,'만약에'
,'무엇'
,'무슨'
,'어느'
,'어떤'
,'아래윗'
,'조차'
,'한데'
,'그럼에도 불구하고'
,'여전히'
,'심지어'
,'까지도'
,'조차도'
,'하지 않도록'
,'않기 위하여'
,'때'
,'어때'
,'어떠한'
,'하여금'
,'네'
,'예'
,'우선'
,'누구'
,'누가 알겠는가'
,'아무도'
,'줄은모른다'
,'줄은 몰랏다'
,'하는 김에'
,'겸사겸사'
,'하는바'
,'그런 까닭에'
,'한 이유는'
,'그러니'
,'그러니까'
,'그'
,'너희'
,'너희들'
,'것'
,'것들'
,'너'
,'위하여'
,'하기 위하여'
,'어찌하여'
,'무엇때문에'
,'나'
,'우리'
,'엉엉'
,'오호'
,'아하'
,'어쨋든'
,'만 못하다'
,'차라리'
,'하는 편이 낫다'
,'상대적으로 말하자면'
,'마치'
,'아니라면'
,'쉿'
,'그렇지 않으면'
,'그렇지 않다면'
,'안 그러면'
,'아니었다면'
,'하든지'
,'아니면'
,'이라면'
,'알았어'
,'하는것도'
,'그만이다'
,'어쩔수 없다'
,'하나'
,'일'
,'일반적으로'
,'일단'
,'한켠으로는'
,'이렇게되면'
,'이와같다면'
,'전부'
,'한마디'
,'한항목'
,'근거로'
,'하기에'
,'아울러'
,'이르기까지'
,'이 되다'
,'로 인하여'
,'까닭으로'
,'이로 인하여'
,'그래서'
,'이 때문에'
,'그러므로'
,'그런 까닭에'
,'알 수 있다'
,'으로 인하여'
,'있다'
,'어떤것'
,'어떤것들'
,'에 대해'
,'이리하여'
,'그리하여'
,'하기보다는'
,'하느니'
,'하면 할수록'
,'운운'
,'이러이러하다'
,'하구나'
,'하도다'
,'다시말하면'
,'다음으로'
,'에 있다'
,'에 달려 있다'
,'우리'
,'우리들'
,'하기는한데'
,'어떻게'
,'어떻해'
,'어찌됏어'
,'어때'
,'어째서'
,'본대로'
,'자'
,'이'
,'이쪽'
,'여기'
,'이것'
,'이번'
,'이렇게말하자면'
,'이런'
,'이러한'
,'이와 같은'
,'이와 같다'
,'이렇구나'
,'것과 같이'
,'따위'
,'와 같은 사람들'
,'왜냐하면'
,'중의하나'
,'에 한하다'
,'하기만 하면'
,'관해서는'
,'여러분'
,'우에 종합한것과같이'
,'총적으로 보면'
,'총적으로 말하면'
,'대로 하다'
,'참'
,'그만이다'
,'할 따름이다'
,'봐'
,'봐라'
,'아니'
,'응'
,'참나'
]

X_train = []
okt = Okt()
for sentence in train_data['document']:
    temp_X = []
    temp_X = okt.morphs(sentence, stem=True) # 토큰화
    temp_X = [word for word in temp_X if not word in stopwords] # 불용어 제거
    X_train.append(temp_X)

print(X_train[:3])

#테스트 데이터에도 수행
X_test = []
for sentence in test_data['document']:
    temp_X = []
    temp_X = okt.morphs(sentence, stem=True) # 토큰화
    temp_X = [word for word in temp_X if not word in stopwords] # 불용어 제거
    X_test.append(temp_X)

    
#예측 데이터에도 수행
X_predict = []
for sentence in predict_data['document']:
    temp_X = []
    temp_X = okt.morphs(sentence, stem=True) # 토큰화
    temp_X = [word for word in temp_X if not word in stopwords] # 불용어 제거
    X_predict.append(temp_X)

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
X_predict = tokenizer.texts_to_sequences(X_predict)

y_train = np.array(train_data['label'])
y_test = np.array(test_data['label'])
y_predict = np.array(predict_data['label'])

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
print("예측 : "+str(len(X_predict)))
print("예측 : "+str(len(y_predict)))

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
X_predict = pad_sequences(X_predict, maxlen = max_len)

###### LSTM 으로 분류


model = Sequential()
model.add(Embedding(vocab_size, 100))
model.add(LSTM(128, stateful = False))
model.add(Dense(1, activation='sigmoid'))

es = EarlyStopping(monitor='val_loss', mode='min', verbose=1, patience=4)
mc = ModelCheckpoint('best_model.h5', monitor='val_acc', mode='max', verbose=1, save_best_only=True)

model.compile(optimizer='rmsprop', loss='binary_crossentropy', metrics=['acc'])
history = model.fit(X_train, y_train, epochs=15, callbacks=[es, mc], batch_size=60, validation_split=0.2)

model.save('best_model2.h5')  # creates a HDF5 file 'my_model.h5'

model_json = model.to_json()
with open("model.json", "w") as json_file : 
    json_file.write(model_json)

model.save_weights("model.h5")

loaded_model = load_model('best_model2.h5')
loaded_model.summary()
#print("\n 테스트 정확도: %.4f" % (loaded_model.evaluate(X_test, y_test)[1]))


# 훈련과 검증 손실 그리기
import matplotlib.pyplot as plt

history_dict = history.history
loss = history_dict['loss']
val_loss = history_dict['val_loss']

epochs = range(1, len(loss) + 1)

plt.plot(epochs, loss, 'bo', label='Training loss')  # ‘bo’는 파란색 점을 의미합니다.
plt.plot(epochs, val_loss, 'b', label='Validation loss') # ‘b’는 파란색 실선을 의미합니다.
plt.title('Training and validation loss')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()
plt.show()

# 훈련과 손실 정확도 그리기
plt.clf() # 그래프를 초기화합니다.
acc = history_dict['acc']
val_acc = history_dict['val_acc']

plt.plot(epochs, acc, 'bo', label='Training acc')
plt.plot(epochs, val_acc, 'b', label='Validation acc')
plt.title('Training and validation accuracy')
plt.xlabel('Epochs')
plt.ylabel('Accuracy')
plt.legend()
plt.show()


## 실제로 predict 해보자
xhat = loaded_model.predict(X_predict)
xhatc = loaded_model.predict_classes(X_predict)
np.set_printoptions(suppress=True)
np.set_printoptions(formatter={'float_kind': lambda x: "{0:0.3f}".format(x)})
x = np.array(xhat)
xc = np.array(xhatc)
np.savetxt("predictedData.txt", x)
np.savetxt("predictedData_class.txt", xc)

