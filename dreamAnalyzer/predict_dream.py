

import pandas as pd
from konlpy.tag import Okt
import numpy as np
from tensorflow.keras.layers import Embedding, Dense, LSTM
from tensorflow.keras.models import Sequential
from tensorflow.keras.models import load_model
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from stopwords import stopwords
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import Tokenizer

loaded_model = load_model('best_model.h5')
#test_data = pd.read_table('interpretation_predict.txt')
test_data = pd.read_table('interpretation_test_pos_neg.txt')

print('예측 샘플의 개수 :',len(test_data))
#### 테스트 데이터에도 동일하게 수행
test_data.drop_duplicates(subset = ['document'], inplace=True) # document 열에서 중복인 내용이 있다면 중복 제거
test_data['document'] = test_data['document'].str.replace("[^ㄱ-ㅎㅏ-ㅣ가-힣 ]","") # 정규 표현식 수행
test_data['document'].replace('', np.nan, inplace=True) # 공백은 Null 값으로 변경
#test_data = test_data.dropna(how='any') # Null 값 제거
print('전처리 후 테스트용 샘플의 개수 :',len(test_data))



okt = Okt()

X_test = []
for sentence in test_data['document']:
    temp_X = []
    temp_X = okt.morphs(sentence, stem=True) # 토큰화
    temp_X = [word for word in temp_X if not word in stopwords] # 불용어 제거
    X_test.append(temp_X)

#시퀀스로 놓음
tokenizer = Tokenizer()
X_test = tokenizer.texts_to_sequences(X_test)

#빈 샘플 제거
max_len = 31
drop_test = [index for index, sentence in enumerate(X_test) if len(sentence) < 1]
X_test = np.delete(X_test, drop_test, axis=0)
X_test = pad_sequences(X_test, maxlen = max_len)

loaded_model.predict(X_test)
