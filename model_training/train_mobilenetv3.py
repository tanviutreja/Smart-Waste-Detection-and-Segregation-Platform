import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator

data_dir = "dataset"
img_size = 224
batch_size = 32

# Data Generator
datagen = ImageDataGenerator(
    rescale=1/255,
    validation_split=0.1,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    shear_range=0.2,
    zoom_range=0.2,
    horizontal_flip=True
)

train_ds = datagen.flow_from_directory(
    data_dir,
    target_size=(img_size, img_size),
    batch_size=batch_size,
    class_mode="categorical",
    subset="training"
)

val_ds = datagen.flow_from_directory(
    data_dir,
    target_size=(img_size, img_size),
    batch_size=batch_size,
    class_mode="categorical",
    subset="validation"
)

# ---- MobileNetV3-Large Base Model ---- #
base_model = tf.keras.applications.MobileNetV3Large(
    input_shape=(224, 224, 3),
    include_top=False,
    weights="imagenet",
    pooling=None
)

base_model.trainable = False  # Freeze initially

# ---- Model Architecture ---- #
model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(10, activation="softmax")
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# ---- First Training (Feature Extraction) ---- #
history = model.fit(train_ds, validation_data=val_ds, epochs=10)

# ---- Fine-Tuning for 98–99% Accuracy ---- #
base_model.trainable = True

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),  # slow LR
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history_ft = model.fit(train_ds, validation_data=val_ds, epochs=10)

# ---- Save Model ---- #
model.save("../backend/model/mobilenetv3_model.keras")
print("\nModel saved successfully as mobilenetv3_model.keras!")
