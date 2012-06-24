
import glob
import Options
import os
import Utils
from TaskGen import feature, after, before

srcdir = '.'
blddir = 'build'
VERSION = '0.0.1'

def set_options(opt):
  opt.tool_options('compiler_cxx')
  opt.add_option('--profile', action='store_true', help='Enable profiling', dest='profile', default=False)

def configure(conf):
  o = Options.options
  conf.env['USE_PROFILING'] = o.profile
  conf.check_tool('compiler_cxx')
  conf.check_tool('node_addon')
  conf.env.append_value('CPPFLAGS', '-DNDEBUG')

  if conf.check(lib='gif', libpath=['/lib', '/usr/lib', '/usr/local/lib'], uselib_store='GIF', mandatory=False):
    conf.env.append_value('CPPFLAGS', '-DHAVE_GIF=1')

  #if conf.check(lib='jpeg', libpath=['/lib', '/usr/lib', '/usr/local/lib'], uselib_store='JPEG', mandatory=False):
  #  conf.env.append_value('CPPFLAGS', '-DHAVE_JPEG=1')

  if conf.env['USE_PROFILING'] == True:
    conf.env.append_value('CXXFLAGS', ['-pg'])
    conf.env.append_value('LINKFLAGS', ['-pg'])

  #conf.check_cfg(package='cairo', args='--cflags --libs', mandatory=True)
  flags = ['-O3', '-Wall', '-D_FILE_OFFSET_BITS=64', '-D_LARGEFILE_SOURCE', '-fPIC']
  conf.env.append_value('CCFLAGS', flags)
  conf.env.append_value('CXXFLAGS', flags)

@feature('cxx')
@after('apply_link')
def apply_add_precompiled(tgen):
  if hasattr(tgen, 'add_precompiled'):
    for i in Utils.to_list(tgen.add_precompiled):
      input_node = tgen.bld.srcnode.find_resource(i)
      tgen.link_task.inputs.append(input_node)

def build(bld):
  obj = bld.new_task_gen('cxx', 'shlib', 'node_addon')
  obj.target = 'canvas'
  obj.source = bld.glob('src/*.cc')
  obj.includes = 'cairo'
  obj.uselib = ['GIF']
  obj.add_precompiled = ['cairo/libcairo.so']