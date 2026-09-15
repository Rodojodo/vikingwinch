import os
import glob

features_dir = 'src/features'
for feature in os.listdir(features_dir):
    type_dir = os.path.join(features_dir, feature, 'types')
    if os.path.isdir(type_dir):
        # Create empty api, domain, state, index
        for f in ['api.ts', 'domain.ts', 'state.ts', 'index.ts']:
            open(os.path.join(type_dir, f), 'a').close()
