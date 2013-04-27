require 'rubygems'
require 'sinatra'
require 'haml'
require 'json'

# Helpers
require './lib/render_partial'

# Set Sinatra variables
set :app_file, __FILE__
set :root, File.dirname(__FILE__)
set :views, 'views'
set :public_folder, 'public'
set :haml, {:format => :html5} # default Haml format is :xhtml

# Application routes
get '/' do
  haml :index, :layout => :'layouts/application'
end

post '/trip' do
  haml :index, :layout => :'layouts/application'
  #redirect to('/trip/whatever')
end

get '/trip/:id/edit' do
  haml :index, :layout => :'layouts/application'
end

get '/trip/:id/suggestions' do
  [
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla'),
    place('Times Square', [], 'bla bla bla')
  ].to_json
end

def place(name, photos, desc)
  {
    name: name,
    id: '1234',
    photos: photos,
    desc: desc
  }
end

