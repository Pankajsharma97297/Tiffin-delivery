if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/Users/cws/.gradle/caches/9.3.1/transforms/9016d4b6c6b4a54c0ab4c0f7c76a985e/transformed/hermes-android-250829098.0.14-debug/prefab/modules/hermesvm/libs/android.armeabi-v7a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/cws/.gradle/caches/9.3.1/transforms/9016d4b6c6b4a54c0ab4c0f7c76a985e/transformed/hermes-android-250829098.0.14-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

