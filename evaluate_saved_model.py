import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report, confusion_matrix
import numpy as np

# SAME SETTINGS AS TRAINING FILE
data_dir = r"C:\Users\utrej\OneDrive\Desktop\sem7\swdasp\Smart-Waste-Detection-and-Segregation-Platform\model_training\dataset"
img_size = 224
batch_size = 32

# SAME DATAGEN, SAME SPLIT
datagen = ImageDataGenerator(
    rescale=1/255,
    validation_split=0.1      # Must match training
)

# Load ONLY the validation split
val_ds = datagen.flow_from_directory(
    data_dir,
    target_size=(img_size, img_size),
    batch_size=batch_size,
    class_mode="categorical",
    subset="validation",
    shuffle=False
)

# Load your trained model
model = tf.keras.models.load_model(
    r"C:\Users\utrej\OneDrive\Desktop\sem7\swdasp\Smart-Waste-Detection-and-Segregation-Platform\backend\model\mobilenetv2_model.h5"
)

# Get predictions
pred_probs = model.predict(val_ds)
pred_classes = np.argmax(pred_probs, axis=1)

# True labels
true_classes = val_ds.classes
class_labels = list(val_ds.class_indices.keys())

print("\nCONFUSION MATRIX:")
print(confusion_matrix(true_classes, pred_classes))

print("\nCLASSIFICATION REPORT:")
print(classification_report(true_classes, pred_classes, target_names=class_labels))
