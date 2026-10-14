if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "C:/Users/Pankaj Sharma/.gradle/caches/9.3.1/transforms/67daa938471124f1534e308417e0eaf4/workspace/transformed/hermes-android-250829098.0.14-release/prefab/modules/hermesvm/libs/android.x86_64/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/Pankaj Sharma/.gradle/caches/9.3.1/transforms/67daa938471124f1534e308417e0eaf4/workspace/transformed/hermes-android-250829098.0.14-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

